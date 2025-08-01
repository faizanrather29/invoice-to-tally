import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded." }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 🧪 Simple OCR using free OCR.space API
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: new URLSearchParams({
        base64Image: `data:${file.type};base64,${btoa(String.fromCharCode(...buffer))}`,
        isOverlayRequired: "false",
        language: "eng",
      }),
      headers: {
        apikey: "helloworld", // public test key (for now)
      },
    });

    const ocrResult = await ocrResponse.json();
    const text = ocrResult?.ParsedResults?.[0]?.ParsedText || "";

    const invoiceNo = /Invoice No\.?\s*[:\-]?\s*(\w+)/i.exec(text)?.[1] || "Unknown";
    const gstin = /GSTIN\s*[:\-]?\s*(\w+)/i.exec(text)?.[1] || "Unknown";
    const total = /Total\s*[:\-]?\s*₹?\s*(\d+(\.\d+)?)/i.exec(text)?.[1] || "0.00";

    const xml = `<?xml version="1.0"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <VOUCHER>
            <INVOICENO>${invoiceNo}</INVOICENO>
            <GSTIN>${gstin}</GSTIN>
            <AMOUNT>${total}</AMOUNT>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
