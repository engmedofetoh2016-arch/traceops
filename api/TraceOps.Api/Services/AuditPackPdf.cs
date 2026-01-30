using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;


namespace TraceOps.Api.Reports;

public record AuditPackData(
    string TenantName,
    DateTimeOffset From,
    DateTimeOffset To,
    int TotalEvents,
    int Success,
    int Failed,
    int Exports,
    List<(string Key, int Count)> TopActions,
    List<(string Key, int Count)> TopActors,
    DateTimeOffset GeneratedAtUtc
);

public static class AuditPackPdf
{
    public static byte[] Build(AuditPackData d)
    {

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(32);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(header =>
                {
                    header.Item().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("TRACEOPS").FontSize(16).SemiBold();
                            col.Item().Text("Audit Pack Report").FontSize(22).Bold();
                            col.Item().Text(d.TenantName).FontSize(11).FontColor(Colors.Grey.Darken2);
                        });

                        row.ConstantItem(220).AlignRight().Column(col =>
                        {
                            col.Item().Text($"Generated (UTC): {d.GeneratedAtUtc:yyyy-MM-dd HH:mm}").FontSize(10);
                            col.Item().Text($"Range: {d.From:yyyy-MM-dd HH:mm} → {d.To:yyyy-MM-dd HH:mm}").FontSize(10);
                            col.Item().Text("Signed timestamp: Included").FontSize(10).FontColor(Colors.Grey.Darken2);
                        });
                    });

                    header.Item().PaddingTop(12);
                    header.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });
                
                page.Content().Column(col =>
                {
                    col.Spacing(14);

                    col.Item().Element(e => KpiRow(e, d));

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Element(e => TopList(e, "Top Actions", d.TopActions));
                        row.Spacing(16);
                        row.RelativeItem().Element(e => TopList(e, "Top Actors", d.TopActors));
                    });

                    col.Item().Element(e =>
                    {
                        e.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(c =>
                        {
                            c.Spacing(6);
                            c.Item().Text("Notes for auditors").Bold();
                            c.Item().Text("• This report summarizes operational audit events captured by TRACEOPS.");
                            c.Item().Text("• CSV export can be generated from the same date range for detailed evidence.");
                            c.Item().Text("• Events are tenant-scoped and access is restricted via JWT tenant claims.");
                        });
                    });
                });

                page.Footer().AlignCenter().DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken2))
                .Text(text => {
                    text.Span("TRACEOPS • Audit Pack • Page ");
                    text.CurrentPageNumber();
                    text.Span(" of ");
                    text.TotalPages();
                });


            });
        });

        return doc.GeneratePdf();
    }

    private static void KpiRow(IContainer c, AuditPackData d)
    {
        c.Row(row =>
        {
            row.RelativeItem().Element(x => Kpi(x, "Total events", d.TotalEvents.ToString(), Colors.Blue.Medium));
            row.Spacing(10);
            row.RelativeItem().Element(x => Kpi(x, "Success", d.Success.ToString(), Colors.Green.Medium));
            row.Spacing(10);
            row.RelativeItem().Element(x => Kpi(x, "Failed", d.Failed.ToString(), Colors.Orange.Medium));
            row.Spacing(10);
            row.RelativeItem().Element(x => Kpi(x, "Exports", d.Exports.ToString(), Colors.Red.Medium));
        });
    }

    private static void Kpi(IContainer c, string label, string value, string accent)
    {
        c.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Background(Colors.White).Column(col =>
        {
            col.Item().Text(label).FontSize(10).FontColor(Colors.Grey.Darken1);
            col.Item().Text(value).FontSize(22).Bold().FontColor(accent);
        });
    }

    private static void TopList(IContainer c, string title, List<(string Key, int Count)> items)
    {
        c.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(col =>
        {
            col.Spacing(8);
            col.Item().Text(title).Bold();

            if (items.Count == 0)
            {
                col.Item().Text("No data.").FontColor(Colors.Grey.Darken1);
                return;
            }

            foreach (var (key, count) in items.Take(8))
            {
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text(key).FontSize(11);
                    r.ConstantItem(50).AlignRight().Text(count.ToString()).FontSize(11).SemiBold();
                });
            }
        });
    }
}
