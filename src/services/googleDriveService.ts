import { Order } from '../types';
import { getAccessToken } from './googleAuth';

export interface DriveSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetName: string;
  totalOrdersExported: number;
}

/**
 * Searches for an existing Spreadsheet created by this app in Google Drive for the specified date,
 * or creates a new Google Spreadsheet formatted with Sales Order Collection headers.
 */
export async function syncOrdersToGoogleSheets(
  orders: Order[],
  targetDate: string,
  userConfirmationCallback?: (message: string) => Promise<boolean>
): Promise<DriveSyncResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('গুগল অ্যাকাউন্টে লগইন করা নেই। প্রথমে Sign in with Google করুন।');
  }

  // Filter orders for the target date or all orders if empty
  const ordersToExport = targetDate
    ? orders.filter((o) => o.date === targetDate)
    : orders;

  if (ordersToExport.length === 0) {
    throw new Error(`${targetDate ? targetDate + ' তারিখে' : ''} কোনো অর্ডার পাওয়া যায়নি।`);
  }

  const sheetTitle = targetDate
    ? `Sales_Orders_${targetDate}`
    : `Sales_Orders_All_${new Date().toISOString().slice(0, 10)}`;

  // Require user confirmation before mutating/writing to Google Drive/Sheets as per guidelines
  if (userConfirmationCallback) {
    const confirmed = await userConfirmationCallback(
      `আপনার গুগল ড্রাইভে '${sheetTitle}' নামে ${ordersToExport.length} টি অর্ডারের এক্সেল/স্প্রেডশীট ফাইল তৈরি ও আপডেট করতে চান?`
    );
    if (!confirmed) {
      throw new Error('ব্যবহারকারী দ্বারা বাতিল করা হয়েছে (Cancelled by user)');
    }
  }

  // 1. Check if a spreadsheet file with this name already exists in user's Drive (using drive.file scope)
  const searchParams = new URLSearchParams({
    q: `name = '${sheetTitle}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: 'files(id, name, webViewLink)',
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Google Drive API Search Error: ${errorText}`);
  }

  const searchData = await searchRes.json();
  let spreadsheetId = '';
  let spreadsheetUrl = '';

  if (searchData.files && searchData.files.length > 0) {
    // Reuse existing spreadsheet
    spreadsheetId = searchData.files[0].id;
    spreadsheetUrl = searchData.files[0].webViewLink;
  } else {
    // 2. Create new Google Spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: sheetTitle,
        },
        sheets: [
          {
            properties: {
              title: 'Orders',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Google Sheets API Error: ${errorText}`);
    }

    const createData = await createRes.json();
    spreadsheetId = createData.spreadsheetId;
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 3. Prepare rows data
  const headerRow = [
    'Order ID',
    'Date',
    'Time',
    'Salesman ID',
    'Salesman Name',
    'Shop Name',
    'Shop Address',
    'Shop Phone',
    'Product Name (EN)',
    'Product Name (BN)',
    'Pack Size',
    'Quantity',
    'Unit Price (BDT)',
    'Item Total (BDT)',
    'Order Total (BDT)',
    'Notes',
    'Sync Status',
  ];

  const rows: (string | number)[][] = [headerRow];

  ordersToExport.forEach((order) => {
    order.items.forEach((item, idx) => {
      rows.push([
        order.id,
        order.date,
        order.time,
        order.salesmanId,
        order.salesmanName,
        order.shopName,
        order.shopAddress,
        order.shopPhone,
        item.productName,
        item.productNameBn,
        item.packSize,
        item.quantity,
        item.unitPrice,
        item.total,
        idx === 0 ? order.totalAmount : '', // Only display total once per order or keep clear
        order.notes || '',
        'Synced to Drive',
      ]);
    });
  });

  // 4. Update the values in Google Sheets
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:Q${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Google Sheets Update Error: ${errorText}`);
  }

  // 5. Apply header formatting (Bold text & green theme styling)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.1,
                    green: 0.5,
                    blue: 0.35,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0,
                    },
                    bold: true,
                    fontSize: 11,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      }),
    });
  } catch (fmtErr) {
    console.warn('Formatting Google Sheet header optional warning:', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    spreadsheetName: sheetTitle,
    totalOrdersExported: ordersToExport.length,
  };
}
