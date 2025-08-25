import { NextRequest, NextResponse } from 'next/server';

async function loadSheetsLib() {
  return import('@/lib/google/sheets');
}

// Valid sheet keys
const VALID_SHEET_KEYS = ['chatbot', 'voicebot', 'career', 'footer', 'contact'];

// GET endpoint to read sheet data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetKey = searchParams.get('sheetKey');

    // Validate sheet key
    if (!sheetKey || !VALID_SHEET_KEYS.includes(sheetKey)) {
      return NextResponse.json(
        { error: 'Invalid sheet key. Must be one of: chatbot, voicebot, career, footer, contact' },
        { status: 400 }
      );
    }

    // Read data from Google Sheets
    const { readSheetData, getSheetMetadata } = await loadSheetsLib();
    const data = await readSheetData(sheetKey);
    
    // Get metadata for additional info
    const metadata = await getSheetMetadata(sheetKey);

    return NextResponse.json({
      success: true,
      data,
      metadata,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in GET /api/leads-sheets:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to write sheet data
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetKey = searchParams.get('sheetKey');

    // Validate sheet key
    if (!sheetKey || !VALID_SHEET_KEYS.includes(sheetKey)) {
      return NextResponse.json(
        { error: 'Invalid sheet key. Must be one of: chatbot, voicebot, career, footer, contact' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { data } = body;

    // Validate data
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data must be a 2D array' },
        { status: 400 }
      );
    }

    // Validate data size
    if (data.length > 20000) {
      return NextResponse.json(
        { error: 'Data exceeds maximum allowed rows (20,000)' },
        { status: 400 }
      );
    }

    if (data.length > 0 && data[0].length > 100) {
      return NextResponse.json(
        { error: 'Data exceeds maximum allowed columns (100)' },
        { status: 400 }
      );
    }

    // Validate payload size (5MB limit)
    const payloadSize = JSON.stringify(data).length;
    if (payloadSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Payload size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Sanitize data (trim strings, ensure all cells are strings)
    const sanitizedData = data.map((row: unknown[]) => 
      row.map((cell: unknown) => 
        typeof cell === 'string' ? cell.trim() : String(cell || '')
      )
    );

    // Write data to Google Sheets
    const { writeSheetData } = await loadSheetsLib();
    await writeSheetData(sheetKey, sanitizedData);

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      rowsSaved: sanitizedData.length,
      columnsSaved: sanitizedData.length > 0 ? sanitizedData[0].length : 0,
      savedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in POST /api/leads-sheets:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
