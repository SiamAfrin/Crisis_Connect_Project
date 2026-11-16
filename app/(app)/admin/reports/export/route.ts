import type { NextRequest } from "next/server";

import { requireActiveRole } from "@/lib/auth/dal";
import {
  buildEmergencyRequestCsv,
  buildRescueActivityCsv,
} from "@/lib/reports/csv-reports";
import {
  getEmergencyRequestReport,
  getRescueActivityReport,
} from "@/lib/reports/data";
import {
  getReportFilename,
  normalizeReportType,
  parseReportRange,
} from "@/lib/reports/params";

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function csvResponse(csv: string, filename: string): Response {
  // The BOM lets Excel detect UTF-8; the fixed filename comes from validated
  // report values and cannot inject extra response headers.
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Downloads one generated report as CSV. Authorization is enforced again on the
 * server, and every row is read through the administrator's RLS session.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { supabase } = await requireActiveRole("administrator");

  const params = request.nextUrl.searchParams;
  const type = normalizeReportType(params.get("report") ?? "");
  const from = (params.get("from") ?? "").trim();
  const to = (params.get("to") ?? "").trim();

  if (from.length > 10 || to.length > 10) {
    return textResponse("Invalid report request.", 400);
  }

  const { range, error } = parseReportRange({ from, to });

  if (error) {
    return textResponse(error, 400);
  }

  if (type === "missions") {
    const { report, error: loadError } = await getRescueActivityReport(
      supabase,
      range,
    );

    if (loadError) {
      return textResponse(
        "The report could not be generated. Try again.",
        500,
      );
    }

    return csvResponse(
      buildRescueActivityCsv(report.rows),
      getReportFilename(type, { from, to }),
    );
  }

  const { report, error: loadError } = await getEmergencyRequestReport(
    supabase,
    range,
  );

  if (loadError) {
    return textResponse("The report could not be generated. Try again.", 500);
  }

  return csvResponse(
    buildEmergencyRequestCsv(report.rows),
    getReportFilename(type, { from, to }),
  );
}
