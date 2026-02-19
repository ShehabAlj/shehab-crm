import { google } from 'googleapis';

// Interface for Lead data
export interface Lead {
  id: string;
  clientName: string;
  projectType: string;
  heatLevel: 'Cold' | 'Warm' | 'Hot';
  status: 'New' | 'In Talk' | 'Working' | 'Testing' | 'Done';
  notes: string;
  value: number; // Added for Kanban Totals
}

export async function getLeads(): Promise<Lead[]> {
  try {
    if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
       console.warn("Google Sheets credentials not found, returning mock data.");
       return getMockLeads();
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets', // Read & Write
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'CRM_Master!A2:F',
    });

    const rows = response.data.values;
    // Safe check for rows
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row: unknown[], index: number) => {
        // Safe access to columns with fallbacks
        const safeGet = (idx: number) => (Array.isArray(row) && row[idx] ? String(row[idx]).trim() : '');
        
        return {
            id: `${index + 2}`, // Row number
            clientName: safeGet(0) || 'Unknown Client',
            projectType: safeGet(1) || 'General Project',
            heatLevel: (['Cold', 'Warm', 'Hot'].includes(safeGet(2)) ? safeGet(2) : 'Cold') as Lead['heatLevel'],
            status: (['New', 'In Talk', 'Working', 'Testing', 'Done'].includes(safeGet(3)) ? safeGet(3) : 'New') as Lead['status'],
            notes: safeGet(4),
            // Parse currency: Remove non-digits, default to 0
            value: parseInt(safeGet(5).replace(/[^0-9]/g, '')) || 0,
        };
    });

  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    return getMockLeads();
  }
}

export async function getIncomingLeads(): Promise<Lead[]> {
  try {
     if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
       return [];
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Leads!A2:E', // Source sheet for website forms
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    return rows.map((row: unknown[], index: number) => {
        const safeGet = (idx: number) => (Array.isArray(row) && row[idx] ? String(row[idx]).trim() : '');
        return {
            id: `incoming-${index}`,
            clientName: safeGet(0) || 'Unknown',
            projectType: 'Website Inquiry', 
            heatLevel: 'Warm', // Default for incoming
            status: 'New',
            notes: `Source: Website. Contact: ${safeGet(1)} ${safeGet(2)}`, // Assuming Name, Email, Msg
            value: 0,
        };
    });

  } catch (error) {
      console.error("Error fetching incoming leads", error);
      return [];
  }
}

export async function createLead(lead: Omit<Lead, 'id'>): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
       return false;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'CRM_Master!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
            lead.clientName,
            lead.projectType,
            lead.heatLevel,
            lead.status,
            lead.notes,
            `OMR ${lead.value}`
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error creating lead:", error);
    return false;
  }
}

// Enum-like objects for dropdown mapping
export const LEAD_OPTIONS = {
    PROJECT_TYPES: ['Mobile App', 'Web Redesign', 'UI/UX Audit', 'AI Integration', 'Full-Stack Dev', 'SEO'],
    HEAT_LEVELS: ['Hot', 'Warm', 'Cold'],
    STATUSES: ['New', 'In Talk', 'Working', 'Done'], // "Testing" is not in user request but in DB.. will keep Testing? User said "New, In Talk, Working, Done"
};

export async function updateLeadFields(rowId: string, updates: Partial<Lead>): Promise<boolean> {
  try {
     if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
       console.warn("No credentials for write-back.");
       return false;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Determine column based on field
    // A=Client, B=Project Type, C=Heat, D=Status, E=Notes, F=Value
    // We can't batch random columns easily with one API call unless we construct the whole row.
    // simpler to just fire individual updates or assume one field at a time for inline edits.
    // If the modal updates multiple, we might need a different approach or multiple calls.
    // For now, let's just support the individual inline edits and re-use updateLeadStatus logic.

    const updateCell = async (col: string, val: string) => {
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEETS_ID,
            range: `CRM_Master!${col}${rowId}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[val]] },
        });
    };

    const promises = [];
    if (updates.clientName) promises.push(updateCell('A', updates.clientName));
    if (updates.projectType) promises.push(updateCell('B', updates.projectType));
    if (updates.heatLevel) promises.push(updateCell('C', updates.heatLevel));
    if (updates.status) promises.push(updateCell('D', updates.status));
    if (updates.notes) promises.push(updateCell('E', updates.notes));
    if (updates.value !== undefined) promises.push(updateCell('F', `OMR ${updates.value}`));

    await Promise.all(promises);
    return true;

  } catch (error) {
      console.error("Error updating lead fields:", error);
      return false;
  }
}

export async function updateLeadStatus(rowId: string, newStatus: string): Promise<boolean> {
    return updateLeadFields(rowId, { status: newStatus as Lead['status'] });
}

function getMockLeads(): Lead[] {
  return [
    { id: '1', clientName: "Acme Corp", projectType: "Web Redesign", heatLevel: "Hot", status: "New", notes: "Needs a refresh for Q3 campaign.", value: 1500 },
    { id: '2', clientName: "Global Tech", projectType: "Mobile App", heatLevel: "Warm", status: "In Talk", notes: "Discussing budget constraints.", value: 5000 },
    { id: '3', clientName: "Startup Inc", projectType: "Consulting", heatLevel: "Cold", status: "Working", notes: "Initial consultation done.", value: 800 },
    { id: '4', clientName: "Lava Cafe", projectType: "Social Media", heatLevel: "Hot", status: "New", notes: "Wants to launch next week.", value: 300 },
    { id: '5', clientName: "Design Studio", projectType: "SEO", heatLevel: "Warm", status: "Done", notes: "Project completed successfully.", value: 1200 },
  ];
}
