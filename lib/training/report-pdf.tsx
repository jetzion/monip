import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import { totalsLabel, type Report, type ReportRow } from "./report";

// Wrap at spaces only; the default hyphenation splits words such as "train-ing".
Font.registerHyphenationCallback((word) => [word]);

type Column = { key: keyof ReportRow; label: string; width: string };

const COLUMNS: Column[] = [
  { key: "dates", label: "Date", width: "13%" },
  { key: "time", label: "Time", width: "9%" },
  { key: "timeZone", label: "Time zone", width: "11%" },
  { key: "type", label: "Training type", width: "11%" },
  { key: "trainer", label: "Trainer", width: "10%" },
  { key: "cruiseLine", label: "Cruise line", width: "11%" },
  { key: "ship", label: "Ship", width: "10%" },
  { key: "startPort", label: "Start port", width: "11%" },
  { key: "cruiseDates", label: "Cruise dates", width: "14%" },
];

const styles = StyleSheet.create({
  page: { padding: 32, paddingBottom: 48, fontFamily: "Helvetica", fontSize: 8, color: "#141b3a" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, marginTop: 4, marginBottom: 12, color: "#3d4ea0" },
  heading: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#c5cbe0", paddingVertical: 3 },
  head: { flexDirection: "row", backgroundColor: "#e6ebf4", paddingVertical: 4, fontFamily: "Helvetica-Bold" },
  cell: { paddingHorizontal: 3 },
  totals: { marginTop: 4, fontFamily: "Helvetica-Bold" },
  empty: { marginTop: 8 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", color: "#5a6280" },
});

function Table({ rows, columns }: { rows: ReportRow[]; columns: Column[] }) {
  return (
    <View>
      <View style={styles.head} fixed>
        {columns.map((column) => (
          <Text key={column.key} style={[styles.cell, { width: column.width }]}>
            {column.label}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row.id} style={styles.row} wrap={false}>
          {columns.map((column) => (
            <Text key={column.key} style={[styles.cell, { width: column.width }]}>
              {String(row[column.key])}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** The training report on US Letter landscape pages, with page numbers. */
function ReportDocument({ report, generated }: { report: Report; generated: string }) {
  const grouped = report.groups.some((group) => group.heading);
  // Grouped sections name the trainer in their heading, so the column is left out.
  const columns = grouped ? COLUMNS.filter((column) => column.key !== "trainer") : COLUMNS;
  const widen = grouped ? { ...columns[columns.length - 1], width: "24%" } : null;
  const shown = widen ? [...columns.slice(0, -1), widen] : columns;
  const hasRows = report.groups.some((group) => group.rows.length);

  return (
    <Document title={`${report.title}, ${report.range}`} author="MONIP Group">
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.subtitle}>{report.range}</Text>
        {!hasRows && <Text style={styles.empty}>No training sessions in these months.</Text>}
        {hasRows &&
          report.groups.map((group) => (
            <View key={group.heading ?? "all"}>
              {group.heading && <Text style={styles.heading}>{group.heading}</Text>}
              <Table rows={group.rows} columns={shown} />
              {grouped && <Text style={styles.totals}>{totalsLabel(group.totals)}</Text>}
            </View>
          ))}
        {hasRows && <Text style={[styles.totals, { marginTop: 12 }]}>Total: {totalsLabel(report.totals)}</Text>}
        <View style={styles.footer} fixed>
          <Text>Generated {generated}. Times are in each session&apos;s own time zone. Confidential.</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** The report as PDF bytes. */
export const reportPdf = (report: Report, generated: string) => renderToBuffer(<ReportDocument report={report} generated={generated} />);
