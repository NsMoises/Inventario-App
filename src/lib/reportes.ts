import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Kardex, DashboardKPI, Producto, Stock } from "./types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-PE", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function exportarReporteKardex(movimientos: Kardex[], titulo?: string) {
  const doc = new jsPDF("landscape");
  const title = titulo ?? "Reporte de Kardex";

  doc.setFontSize(18).text(title, 14, 20);
  doc.setFontSize(10).text(`Generado: ${new Date().toLocaleString("es-PE")}`, 14, 28);
  doc.setFontSize(10).text(`Total de movimientos: ${movimientos.length}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [["Fecha", "Producto", "SKU", "Tipo", "Cantidad", "Origen", "Destino", "Usuario"]],
    body: movimientos.map((m) => [
      formatDate(m.fecha_hora),
      m.productos?.nombre ?? "—",
      m.productos?.sku ?? "—",
      m.tipo_movimiento,
      m.cantidad,
      m.tienda_origen?.nombre ?? "—",
      m.tienda_destino?.nombre ?? "—",
      m.perfiles?.nombre_completo ?? "—",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`kardex_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportarReporteDashboard(kpi: DashboardKPI, tienda?: string) {
  const doc = new jsPDF();
  const title = tienda
    ? `Dashboard Diario - ${tienda}`
    : "Dashboard Diario - Consolidado";

  doc.setFontSize(20).text("Reporte Diario de Inventario", 14, 20);
  doc.setFontSize(10).text(`Generado: ${new Date().toLocaleString("es-PE")}`, 14, 28);
  if (tienda) doc.setFontSize(10).text(`Tienda: ${tienda}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [["Métrica", "Cantidad de ops", "Total unidades"]],
    body: [
      ["Ventas (Salidas)", String(kpi.cantidad_ventas), String(kpi.total_ventas)],
      ["Entradas", String(kpi.cantidad_entradas), String(kpi.total_entradas)],
      ["Transferencias", String(kpi.cantidad_transferencias), String(kpi.total_transferencias)],
    ],
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`dashboard_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportarReporteStock(stock: Stock[], tiendaNombre?: string) {
  const doc = new jsPDF();
  const title = tiendaNombre
    ? `Inventario - ${tiendaNombre}`
    : "Inventario General";

  doc.setFontSize(20).text(title, 14, 20);
  doc.setFontSize(10).text(`Generado: ${new Date().toLocaleString("es-PE")}`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [["Producto", "SKU", "Categoría", "Stock Actual", "Stock Mínimo", "P. Venta"]],
    body: stock.map((s) => [
      s.productos?.nombre ?? "—",
      s.productos?.sku ?? "—",
      s.productos?.categoria ?? "—",
      s.cantidad,
      s.productos?.stock_minimo ?? 0,
      s.productos?.precio_venta ? `S/ ${s.productos.precio_venta.toFixed(2)}` : "—",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`inventario_${new Date().toISOString().split("T")[0]}.pdf`);
}
