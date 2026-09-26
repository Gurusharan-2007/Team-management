import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, RGB } from "pdf-lib";

export interface PdfReportData {
  report: {
    id: string;
    week_start: string;
    week_end: string;
    status: string;
    generated_at: string | null;
  };
  weekLabel: string;
  teamTimezone: string;
  teamReport: {
    total_activity_points: number;
    total_reward_points: number;
    total_courses_completed: number;
    active_member_count: number;
    updated_member_count: number;
    generated_at: string;
  } | null;
  previousTeamReport: {
    total_activity_points: number;
    total_reward_points: number;
    total_courses_completed: number;
    active_member_count: number;
    updated_member_count: number;
  } | null;
  // Permitted member reports - STRICTLY filtered by role before passing into generator
  memberReports: Array<{
    member_id: string;
    full_name: string;
    email: string;
    role: string;
    activity_points: number;
    reward_points: number;
    courses_completed: number;
    updated_on_saturday: boolean;
    last_update_at: string | null;
    previous_activity_points: number | null;
    previous_reward_points: number | null;
    activity_change: number | null;
    reward_change: number | null;
  }>;
  teamTrends: Array<{
    week_start: string;
    week_end: string;
    week_label: string;
    activity_points: number;
    reward_points: number;
    updated_member_count?: number;
    courses_completed?: number;
  }>;
  isLeadershipView: boolean;
}

// Color Palette
const C_DARK_NAVY: RGB = rgb(0.06, 0.09, 0.16);    // #0F172A
const C_SLATE: RGB = rgb(0.2, 0.25, 0.33);         // #334155
const C_MUTED: RGB = rgb(0.39, 0.45, 0.55);        // #64748B
const C_BORDER: RGB = rgb(0.85, 0.88, 0.92);       // #D9E0E8
const C_CARD_BG: RGB = rgb(0.96, 0.97, 0.99);      // #F5F8FC
const C_HEADER_BG: RGB = rgb(0.92, 0.94, 0.97);    // #EBF0F8
const C_WHITE: RGB = rgb(1, 1, 1);
const C_PRIMARY: RGB = rgb(0.14, 0.39, 0.92);      // #2563EB
const C_SUCCESS: RGB = rgb(0.02, 0.59, 0.41);      // #059669
const C_DANGER: RGB = rgb(0.88, 0.23, 0.23);       // #DC2626
const C_AMBER: RGB = rgb(0.85, 0.53, 0.05);        // #D97706

function sanitizeText(str: string | null | undefined): string {
  if (!str) return "";
  // PDF Standard Helvetica supports WinAnsi / Latin-1 characters
  return str.replace(/[^\x20-\x7E]/g, " ").trim();
}

function truncateText(
  font: PDFFont,
  text: string,
  maxWidth: number,
  size: number
): string {
  const clean = sanitizeText(text);
  if (font.widthOfTextAtSize(clean, size) <= maxWidth) {
    return clean;
  }
  let truncated = clean;
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + "...", size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? truncated + "..." : "";
}

function formatDelta(change: number | null | undefined): string {
  if (change === null || change === undefined) return "—";
  if (change > 0) return `+${change}`;
  return `${change}`;
}

export async function generateWeeklyReportPdf(data: PdfReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 532 pt

  // ============================================================================
  // PAGE 1: EXECUTIVE SUMMARY
  // ============================================================================
  const page1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let curY = PAGE_HEIGHT - 45;

  // 1. Top Brand Header
  page1.drawRectangle({
    x: MARGIN_LEFT,
    y: curY - 24,
    width: 90,
    height: 24,
    color: C_PRIMARY,
  });
  page1.drawText("TEAM PORTAL", {
    x: MARGIN_LEFT + 10,
    y: curY - 17,
    size: 10,
    font: fontBold,
    color: C_WHITE,
  });

  page1.drawText("WEEKLY PERFORMANCE REPORT", {
    x: MARGIN_LEFT + 100,
    y: curY - 17,
    size: 11,
    font: fontBold,
    color: C_SLATE,
  });

  curY -= 40;

  // 2. Document Title & Period
  page1.drawText("Weekly Team Performance Report", {
    x: MARGIN_LEFT,
    y: curY,
    size: 20,
    font: fontBold,
    color: C_DARK_NAVY,
  });

  curY -= 20;

  page1.drawText(`Reporting Cycle: ${sanitizeText(data.weekLabel)}`, {
    x: MARGIN_LEFT,
    y: curY,
    size: 12,
    font: fontBold,
    color: C_PRIMARY,
  });

  curY -= 22;

  // 3. Metadata Banner Box
  const metaBoxHeight = 52;
  page1.drawRectangle({
    x: MARGIN_LEFT,
    y: curY - metaBoxHeight,
    width: CONTENT_WIDTH,
    height: metaBoxHeight,
    color: C_CARD_BG,
    borderColor: C_BORDER,
    borderWidth: 1,
  });

  const genDateStr = data.report.generated_at
    ? new Date(data.report.generated_at).toLocaleString("en-US", {
        timeZone: data.teamTimezone || "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }) + ` (${data.teamTimezone || "Asia/Kolkata"})`
    : "Not finalized";

  const metaCol1X = MARGIN_LEFT + 16;
  const metaCol2X = MARGIN_LEFT + 190;
  const metaCol3X = MARGIN_LEFT + 360;

  // Row 1
  page1.drawText("STATUS:", { x: metaCol1X, y: curY - 18, size: 8, font: fontBold, color: C_MUTED });
  page1.drawText("Finalized Snapshot", { x: metaCol1X + 44, y: curY - 18, size: 8, font: fontBold, color: C_SUCCESS });

  page1.drawText("REPORT ID:", { x: metaCol2X, y: curY - 18, size: 8, font: fontBold, color: C_MUTED });
  const reportIdShort = data.report.id ? data.report.id.slice(0, 18) + "..." : "N/A";
  page1.drawText(reportIdShort, { x: metaCol2X + 54, y: curY - 18, size: 8, font: fontRegular, color: C_SLATE });

  page1.drawText("SCOPE:", { x: metaCol3X, y: curY - 18, size: 8, font: fontBold, color: C_MUTED });
  page1.drawText(data.isLeadershipView ? "Full Team Roster" : "Individual Member", {
    x: metaCol3X + 40,
    y: curY - 18,
    size: 8,
    font: fontBold,
    color: C_SLATE,
  });

  // Row 2
  page1.drawText("GENERATED:", { x: metaCol1X, y: curY - 36, size: 8, font: fontBold, color: C_MUTED });
  page1.drawText(genDateStr, { x: metaCol1X + 62, y: curY - 36, size: 8, font: fontRegular, color: C_SLATE });

  curY -= (metaBoxHeight + 25);

  // 4. Section: Executive KPI Overview
  page1.drawText("Executive Performance Metrics", {
    x: MARGIN_LEFT,
    y: curY,
    size: 13,
    font: fontBold,
    color: C_DARK_NAVY,
  });

  page1.drawLine({
    start: { x: MARGIN_LEFT, y: curY - 6 },
    end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: curY - 6 },
    thickness: 1,
    color: C_BORDER,
  });

  curY -= 20;

  // Metric Calculations
  const tRep = data.teamReport;
  const prevTRep = data.previousTeamReport;

  const totalAct = tRep?.total_activity_points ?? 0;
  const totalRew = tRep?.total_reward_points ?? 0;
  const coursesDone = tRep?.total_courses_completed ?? 0;
  const activeMembers = tRep?.active_member_count ?? data.memberReports.length;
  const updatedMembers = tRep?.updated_member_count ?? 0;
  const compliancePct = activeMembers > 0 ? Math.round((updatedMembers / activeMembers) * 100) : 0;

  let actDeltaStr = "—";
  let actDeltaColor = C_MUTED;
  if (prevTRep) {
    const diff = totalAct - prevTRep.total_activity_points;
    actDeltaStr = diff > 0 ? `+${diff} vs prev` : diff < 0 ? `${diff} vs prev` : "0 vs prev";
    actDeltaColor = diff > 0 ? C_SUCCESS : diff < 0 ? C_DANGER : C_MUTED;
  }

  let rewDeltaStr = "—";
  let rewDeltaColor = C_MUTED;
  if (prevTRep) {
    const diff = totalRew - prevTRep.total_reward_points;
    rewDeltaStr = diff > 0 ? `+${diff} vs prev` : diff < 0 ? `${diff} vs prev` : "0 vs prev";
    rewDeltaColor = diff > 0 ? C_SUCCESS : diff < 0 ? C_DANGER : C_MUTED;
  }

  // 6 KPI Grid Cards (2 rows of 3)
  const cardGap = 12;
  const cardWidth = (CONTENT_WIDTH - 2 * cardGap) / 3; // ~169.3 pt
  const cardHeight = 72;

  const kpisRow1 = [
    { title: "TOTAL ACTIVITY POINTS", value: `${totalAct}`, sub: actDeltaStr, subColor: actDeltaColor },
    { title: "TOTAL REWARD POINTS", value: `${totalRew}`, sub: rewDeltaStr, subColor: rewDeltaColor },
    { title: "COURSES COMPLETED", value: `${coursesDone}`, sub: "verified modules", subColor: C_MUTED },
  ];

  const kpisRow2 = [
    { title: "ACTIVE TEAM MEMBERS", value: `${activeMembers}`, sub: "registered profiles", subColor: C_MUTED },
    { title: "SATURDAY CHECK-INS", value: `${updatedMembers} / ${activeMembers}`, sub: `${compliancePct}% compliance`, subColor: compliancePct >= 80 ? C_SUCCESS : C_AMBER },
    { title: "CYCLE SNAPSHOT STATUS", value: "FINALIZED", sub: "immutable record", subColor: C_PRIMARY },
  ];

  // Draw Row 1
  kpisRow1.forEach((kpi, idx) => {
    const cardX = MARGIN_LEFT + idx * (cardWidth + cardGap);
    const cardY = curY - cardHeight;
    page1.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      color: C_CARD_BG,
      borderColor: C_BORDER,
      borderWidth: 1,
    });
    page1.drawText(kpi.title, { x: cardX + 12, y: cardY + cardHeight - 16, size: 7.5, font: fontBold, color: C_MUTED });
    page1.drawText(kpi.value, { x: cardX + 12, y: cardY + cardHeight - 40, size: 18, font: fontBold, color: C_DARK_NAVY });
    page1.drawText(kpi.sub, { x: cardX + 12, y: cardY + cardHeight - 56, size: 8, font: fontRegular, color: kpi.subColor });
  });

  curY -= (cardHeight + cardGap);

  // Draw Row 2
  kpisRow2.forEach((kpi, idx) => {
    const cardX = MARGIN_LEFT + idx * (cardWidth + cardGap);
    const cardY = curY - cardHeight;
    page1.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      color: C_CARD_BG,
      borderColor: C_BORDER,
      borderWidth: 1,
    });
    page1.drawText(kpi.title, { x: cardX + 12, y: cardY + cardHeight - 16, size: 7.5, font: fontBold, color: C_MUTED });
    page1.drawText(kpi.value, { x: cardX + 12, y: cardY + cardHeight - 40, size: 18, font: fontBold, color: C_DARK_NAVY });
    page1.drawText(kpi.sub, { x: cardX + 12, y: cardY + cardHeight - 56, size: 8, font: fontRegular, color: kpi.subColor });
  });

  curY -= (cardHeight + 30);

  // 5. Section: Executive Highlights Commentary
  page1.drawText("Executive Highlights & Performance Context", {
    x: MARGIN_LEFT,
    y: curY,
    size: 13,
    font: fontBold,
    color: C_DARK_NAVY,
  });

  page1.drawLine({
    start: { x: MARGIN_LEFT, y: curY - 6 },
    end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: curY - 6 },
    thickness: 1,
    color: C_BORDER,
  });

  curY -= 24;

  const commentaryBoxHeight = 160;
  page1.drawRectangle({
    x: MARGIN_LEFT,
    y: curY - commentaryBoxHeight,
    width: CONTENT_WIDTH,
    height: commentaryBoxHeight,
    color: C_CARD_BG,
    borderColor: C_BORDER,
    borderWidth: 1,
  });

  let commentY = curY - 24;

  if (!prevTRep) {
    // Requirement 4: Insufficient historical data neutral statement
    page1.drawText("Insufficient historical data for comparison.", {
      x: MARGIN_LEFT + 16,
      y: commentY,
      size: 10,
      font: fontBold,
      color: C_SLATE,
    });
    commentY -= 18;
    page1.drawText(
      "This snapshot represents the initial baseline performance period recorded in the Team Portal.",
      { x: MARGIN_LEFT + 16, y: commentY, size: 9, font: fontRegular, color: C_MUTED }
    );
    commentY -= 16;
    page1.drawText(
      `Total recorded activity: ${totalAct} points across ${activeMembers} active member profiles.`,
      { x: MARGIN_LEFT + 16, y: commentY, size: 9, font: fontRegular, color: C_MUTED }
    );
    commentY -= 16;
    page1.drawText(
      `Saturday check-in adherence was recorded at ${compliancePct}% (${updatedMembers} of ${activeMembers} updates).`,
      { x: MARGIN_LEFT + 16, y: commentY, size: 9, font: fontRegular, color: C_MUTED }
    );
    commentY -= 16;
    page1.drawText(
      "Comparative momentum metrics and delta analytics will automatically populate in subsequent cycles.",
      { x: MARGIN_LEFT + 16, y: commentY, size: 9, font: fontOblique, color: C_MUTED }
    );
  } else {
    // Real derived commentary
    const actDiff = totalAct - prevTRep.total_activity_points;
    const actGrowthPct = prevTRep.total_activity_points > 0
      ? Math.round((actDiff / prevTRep.total_activity_points) * 100)
      : null;

    const rewDiff = totalRew - prevTRep.total_reward_points;

    // Bullet 1: Team Momentum
    page1.drawText("• Team Momentum:", { x: MARGIN_LEFT + 16, y: commentY, size: 9.5, font: fontBold, color: C_DARK_NAVY });
    const momentumText = actDiff > 0
      ? `Team activity increased by +${actDiff} points (${actGrowthPct !== null ? `+${actGrowthPct}%` : "baseline"}) compared to previous cycle.`
      : actDiff < 0
      ? `Team activity adjusted by ${actDiff} points compared to the previous cycle.`
      : "Team activity maintained exact consistency with the previous cycle.";
    page1.drawText(momentumText, { x: MARGIN_LEFT + 130, y: commentY, size: 9, font: fontRegular, color: C_SLATE });
    commentY -= 20;

    // Bullet 2: Reward Growth
    page1.drawText("• Reward Velocity:", { x: MARGIN_LEFT + 16, y: commentY, size: 9.5, font: fontBold, color: C_DARK_NAVY });
    const rewText = rewDiff > 0
      ? `Reward points expanded by +${rewDiff} points across verified milestones.`
      : rewDiff < 0
      ? `Net reward point adjustments resulted in a change of ${rewDiff} points.`
      : "Reward balance remained unchanged during this cycle.";
    page1.drawText(rewText, { x: MARGIN_LEFT + 130, y: commentY, size: 9, font: fontRegular, color: C_SLATE });
    commentY -= 20;

    // Bullet 3: Saturday Check-in Compliance
    page1.drawText("• Check-in Adherence:", { x: MARGIN_LEFT + 16, y: commentY, size: 9.5, font: fontBold, color: C_DARK_NAVY });
    const compText = `${compliancePct}% of active members (${updatedMembers} / ${activeMembers}) submitted finalized Saturday check-ins.`;
    page1.drawText(compText, { x: MARGIN_LEFT + 130, y: commentY, size: 9, font: fontRegular, color: C_SLATE });
    commentY -= 20;

    // Bullet 4: Most Improved Member (strictly derived from data)
    let topImprover: (typeof data.memberReports)[0] | null = null;
    let maxImprovement = 0;
    data.memberReports.forEach((m) => {
      if (m.activity_change && m.activity_change > maxImprovement) {
        maxImprovement = m.activity_change;
        topImprover = m;
      }
    });

    page1.drawText("• Top Improvement:", { x: MARGIN_LEFT + 16, y: commentY, size: 9.5, font: fontBold, color: C_DARK_NAVY });
    if (topImprover && maxImprovement > 0) {
      const improverText = `${(topImprover as any).full_name} led weekly momentum with +${maxImprovement} activity points.`;
      page1.drawText(improverText, { x: MARGIN_LEFT + 130, y: commentY, size: 9, font: fontRegular, color: C_SUCCESS });
    } else {
      page1.drawText("No individual positive activity deltas recorded this cycle.", {
        x: MARGIN_LEFT + 130,
        y: commentY,
        size: 9,
        font: fontRegular,
        color: C_MUTED,
      });
    }
    commentY -= 20;

    // Bullet 5: Technical Courses
    page1.drawText("• Course Milestones:", { x: MARGIN_LEFT + 16, y: commentY, size: 9.5, font: fontBold, color: C_DARK_NAVY });
    page1.drawText(`${coursesDone} total technical modules verified complete as of this finalized snapshot.`, {
      x: MARGIN_LEFT + 130,
      y: commentY,
      size: 9,
      font: fontRegular,
      color: C_SLATE,
    });
  }

  // ============================================================================
  // PAGE 2: TEAM PERFORMANCE TRENDS
  // ============================================================================
  const page2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let p2Y = PAGE_HEIGHT - 45;

  // Running Header
  page2.drawText("TEAM PORTAL • PERFORMANCE TRENDS", {
    x: MARGIN_LEFT,
    y: p2Y,
    size: 9,
    font: fontBold,
    color: C_PRIMARY,
  });
  page2.drawText(`Cycle: ${sanitizeText(data.weekLabel)}`, {
    x: MARGIN_LEFT + 320,
    y: p2Y,
    size: 8.5,
    font: fontRegular,
    color: C_MUTED,
  });

  p2Y -= 25;

  page2.drawText("Historical Team Performance Trends", {
    x: MARGIN_LEFT,
    y: p2Y,
    size: 16,
    font: fontBold,
    color: C_DARK_NAVY,
  });

  p2Y -= 15;

  page2.drawText(
    "Chronological snapshot metrics captured at Saturday 8:00 PM finalized closing intervals.",
    { x: MARGIN_LEFT, y: p2Y, size: 9, font: fontRegular, color: C_MUTED }
  );

  p2Y -= 25;

  // Trends Table
  const tColWidths = [180, 85, 85, 95, 87]; // total = 532
  const tHeaders = ["REPORTING PERIOD", "ACTIVITY PTS", "REWARD PTS", "CHECK-INS", "COURSES DONE"];

  // Draw Table Header
  const rowHeight = 24;
  page2.drawRectangle({
    x: MARGIN_LEFT,
    y: p2Y - rowHeight,
    width: CONTENT_WIDTH,
    height: rowHeight,
    color: C_HEADER_BG,
    borderColor: C_BORDER,
    borderWidth: 1,
  });

  let tHeadX = MARGIN_LEFT;
  tHeaders.forEach((th, i) => {
    page2.drawText(th, {
      x: tHeadX + 8,
      y: p2Y - rowHeight + 8,
      size: 8,
      font: fontBold,
      color: C_DARK_NAVY,
    });
    tHeadX += tColWidths[i];
  });

  p2Y -= rowHeight;

  if (!data.teamTrends || data.teamTrends.length === 0) {
    // Current snapshot single row
    page2.drawRectangle({
      x: MARGIN_LEFT,
      y: p2Y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: C_CARD_BG,
      borderColor: C_BORDER,
      borderWidth: 0.5,
    });
    page2.drawText(sanitizeText(data.weekLabel) + " (Current)", {
      x: MARGIN_LEFT + 8,
      y: p2Y - rowHeight + 8,
      size: 8.5,
      font: fontRegular,
      color: C_SLATE,
    });
    page2.drawText(`${totalAct}`, {
      x: MARGIN_LEFT + tColWidths[0] + 8,
      y: p2Y - rowHeight + 8,
      size: 8.5,
      font: fontRegular,
      color: C_SLATE,
    });
    page2.drawText(`${totalRew}`, {
      x: MARGIN_LEFT + tColWidths[0] + tColWidths[1] + 8,
      y: p2Y - rowHeight + 8,
      size: 8.5,
      font: fontRegular,
      color: C_SLATE,
    });
    page2.drawText(`${updatedMembers} / ${activeMembers}`, {
      x: MARGIN_LEFT + tColWidths[0] + tColWidths[1] + tColWidths[2] + 8,
      y: p2Y - rowHeight + 8,
      size: 8.5,
      font: fontRegular,
      color: C_SLATE,
    });
    page2.drawText(`${coursesDone}`, {
      x: MARGIN_LEFT + tColWidths[0] + tColWidths[1] + tColWidths[2] + tColWidths[3] + 8,
      y: p2Y - rowHeight + 8,
      size: 8.5,
      font: fontRegular,
      color: C_SLATE,
    });
    p2Y -= rowHeight;
  } else {
    data.teamTrends.forEach((trend, idx) => {
      const isAlt = idx % 2 === 1;
      const isSelected = trend.week_start === data.report.week_start;

      page2.drawRectangle({
        x: MARGIN_LEFT,
        y: p2Y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: isSelected ? rgb(0.92, 0.96, 1.0) : isAlt ? C_CARD_BG : C_WHITE,
        borderColor: C_BORDER,
        borderWidth: 0.5,
      });

      const label = truncateText(fontRegular, trend.week_label + (isSelected ? " *" : ""), tColWidths[0] - 16, 8.5);
      page2.drawText(label, {
        x: MARGIN_LEFT + 8,
        y: p2Y - rowHeight + 8,
        size: 8.5,
        font: isSelected ? fontBold : fontRegular,
        color: isSelected ? C_PRIMARY : C_SLATE,
      });

      page2.drawText(`${trend.activity_points}`, {
        x: MARGIN_LEFT + tColWidths[0] + 8,
        y: p2Y - rowHeight + 8,
        size: 8.5,
        font: isSelected ? fontBold : fontRegular,
        color: C_SLATE,
      });

      page2.drawText(`${trend.reward_points}`, {
        x: MARGIN_LEFT + tColWidths[0] + tColWidths[1] + 8,
        y: p2Y - rowHeight + 8,
        size: 8.5,
        font: isSelected ? fontBold : fontRegular,
        color: C_SLATE,
      });

      const upStr = trend.updated_member_count !== undefined ? `${trend.updated_member_count}` : "—";
      page2.drawText(upStr, {
        x: MARGIN_LEFT + tColWidths[0] + tColWidths[1] + tColWidths[2] + 8,
        y: p2Y - rowHeight + 8,
        size: 8.5,
        font: isSelected ? fontBold : fontRegular,
        color: C_SLATE,
      });

      const crsStr = trend.courses_completed !== undefined ? `${trend.courses_completed}` : "—";
      page2.drawText(crsStr, {
        x: MARGIN_LEFT + tColWidths[0] + tColWidths[1] + tColWidths[2] + tColWidths[3] + 8,
        y: p2Y - rowHeight + 8,
        size: 8.5,
        font: isSelected ? fontBold : fontRegular,
        color: C_SLATE,
      });

      p2Y -= rowHeight;
    });
  }

  p2Y -= 15;
  page2.drawText("* Selected weekly reporting period", {
    x: MARGIN_LEFT,
    y: p2Y,
    size: 7.5,
    font: fontOblique,
    color: C_MUTED,
  });

  // ============================================================================
  // PAGE 3+: MEMBER PERFORMANCE SNAPSHOTS (WITH STRICT ROLE PRIVACY)
  // ============================================================================
  // Requirement 5: Privacy is enforced BEFORE pdf-generator is called.
  // The memberReports array passed in contains ONLY permitted members.
  let curMemberPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let mY = PAGE_HEIGHT - 45;

  const mColWidths = [150, 75, 85, 80, 60, 82]; // Total = 532
  const mHeaders = ["MEMBER", "ROLE", "ACTIVITY", "REWARD", "COURSES", "CHECK-IN"];

  const drawMemberPageHeader = (page: PDFPage, isFirstMemberPage: boolean) => {
    let y = PAGE_HEIGHT - 45;
    page.drawText("TEAM PORTAL • MEMBER PERFORMANCE SNAPSHOTS", {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fontBold,
      color: C_PRIMARY,
    });
    page.drawText(`Cycle: ${sanitizeText(data.weekLabel)}`, {
      x: MARGIN_LEFT + 320,
      y,
      size: 8.5,
      font: fontRegular,
      color: C_MUTED,
    });

    y -= 25;

    const sectionTitle = data.isLeadershipView
      ? "Team Member Performance Snapshots"
      : "Individual Member Performance Snapshot";

    page.drawText(sectionTitle, {
      x: MARGIN_LEFT,
      y,
      size: 16,
      font: fontBold,
      color: C_DARK_NAVY,
    });

    y -= 15;

    const privacyNote = data.isLeadershipView
      ? "Comprehensive leadership view of all member weekly balances and Saturday check-in verification."
      : "Confidential individual performance summary for the authenticated member.";

    page.drawText(privacyNote, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fontRegular,
      color: C_MUTED,
    });

    y -= 25;

    // Draw Table Header
    page.drawRectangle({
      x: MARGIN_LEFT,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: C_HEADER_BG,
      borderColor: C_BORDER,
      borderWidth: 1,
    });

    let headX = MARGIN_LEFT;
    mHeaders.forEach((th, i) => {
      page.drawText(th, {
        x: headX + 8,
        y: y - rowHeight + 8,
        size: 8,
        font: fontBold,
        color: C_DARK_NAVY,
      });
      headX += mColWidths[i];
    });

    return y - rowHeight;
  };

  mY = drawMemberPageHeader(curMemberPage, true);

  const memberRowHeight = 28;
  const bottomThreshold = 65;

  if (data.memberReports.length === 0) {
    curMemberPage.drawRectangle({
      x: MARGIN_LEFT,
      y: mY - memberRowHeight,
      width: CONTENT_WIDTH,
      height: memberRowHeight,
      color: C_CARD_BG,
      borderColor: C_BORDER,
      borderWidth: 0.5,
    });
    curMemberPage.drawText("No member performance snapshots recorded for this cycle.", {
      x: MARGIN_LEFT + 12,
      y: mY - memberRowHeight + 10,
      size: 8.5,
      font: fontRegular,
      color: C_MUTED,
    });
  } else {
    for (let i = 0; i < data.memberReports.length; i++) {
      const mr = data.memberReports[i];

      // Check if we need to paginate to a new page
      if (mY - memberRowHeight < bottomThreshold) {
        curMemberPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        mY = drawMemberPageHeader(curMemberPage, false);
      }

      const isAlt = i % 2 === 1;
      curMemberPage.drawRectangle({
        x: MARGIN_LEFT,
        y: mY - memberRowHeight,
        width: CONTENT_WIDTH,
        height: memberRowHeight,
        color: isAlt ? C_CARD_BG : C_WHITE,
        borderColor: C_BORDER,
        borderWidth: 0.5,
      });

      // Col 1: Member Name & Email
      const nameText = truncateText(fontBold, mr.full_name || "Team Member", mColWidths[0] - 16, 8.5);
      const emailText = truncateText(fontRegular, mr.email || "", mColWidths[0] - 16, 7);
      curMemberPage.drawText(nameText, {
        x: MARGIN_LEFT + 8,
        y: mY - 12,
        size: 8.5,
        font: fontBold,
        color: C_DARK_NAVY,
      });
      curMemberPage.drawText(emailText, {
        x: MARGIN_LEFT + 8,
        y: mY - 22,
        size: 7,
        font: fontRegular,
        color: C_MUTED,
      });

      // Col 2: Role
      const roleLabel = mr.role
        ? mr.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Member";
      curMemberPage.drawText(roleLabel, {
        x: MARGIN_LEFT + mColWidths[0] + 8,
        y: mY - 17,
        size: 8,
        font: fontRegular,
        color: C_SLATE,
      });

      // Col 3: Activity Points + Delta (Requirement 3: "—" if no prev data)
      const actDelta = formatDelta(mr.activity_change);
      const actStr = `${mr.activity_points} (${actDelta})`;
      curMemberPage.drawText(actStr, {
        x: MARGIN_LEFT + mColWidths[0] + mColWidths[1] + 8,
        y: mY - 17,
        size: 8,
        font: fontRegular,
        color: mr.activity_change && mr.activity_change > 0 ? C_SUCCESS : C_SLATE,
      });

      // Col 4: Reward Points + Delta
      const rewDelta = formatDelta(mr.reward_change);
      const rewStr = `${mr.reward_points} (${rewDelta})`;
      curMemberPage.drawText(rewStr, {
        x: MARGIN_LEFT + mColWidths[0] + mColWidths[1] + mColWidths[2] + 8,
        y: mY - 17,
        size: 8,
        font: fontRegular,
        color: mr.reward_change && mr.reward_change > 0 ? C_SUCCESS : C_SLATE,
      });

      // Col 5: Courses Done
      curMemberPage.drawText(`${mr.courses_completed || 0}`, {
        x: MARGIN_LEFT + mColWidths[0] + mColWidths[1] + mColWidths[2] + mColWidths[3] + 8,
        y: mY - 17,
        size: 8,
        font: fontRegular,
        color: C_SLATE,
      });

      // Col 6: Saturday Check-in Status
      const statusText = mr.updated_on_saturday ? "Submitted" : "Pending";
      const statusColor = mr.updated_on_saturday ? C_SUCCESS : C_AMBER;
      curMemberPage.drawText(statusText, {
        x: MARGIN_LEFT + mColWidths[0] + mColWidths[1] + mColWidths[2] + mColWidths[3] + mColWidths[4] + 8,
        y: mY - 17,
        size: 8,
        font: fontBold,
        color: statusColor,
      });

      mY -= memberRowHeight;
    }
  }

  // ============================================================================
  // FOOTER NUMBERING ACROSS ALL PAGES
  // ============================================================================
  const pages = doc.getPages();
  const totalPages = pages.length;

  pages.forEach((p, idx) => {
    const pageNum = idx + 1;
    const footerY = 24;

    p.drawLine({
      start: { x: MARGIN_LEFT, y: footerY + 12 },
      end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: footerY + 12 },
      thickness: 0.5,
      color: C_BORDER,
    });

    p.drawText("Team Portal • Confidential Performance Snapshot Record", {
      x: MARGIN_LEFT,
      y: footerY,
      size: 7.5,
      font: fontRegular,
      color: C_MUTED,
    });

    const pageStr = `Page ${pageNum} of ${totalPages}`;
    const pageStrWidth = fontRegular.widthOfTextAtSize(pageStr, 7.5);
    p.drawText(pageStr, {
      x: MARGIN_LEFT + CONTENT_WIDTH - pageStrWidth,
      y: footerY,
      size: 7.5,
      font: fontRegular,
      color: C_MUTED,
    });
  });

  return await doc.save();
}
