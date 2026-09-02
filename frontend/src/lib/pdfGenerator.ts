import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollRecord, PayrollPeriod } from '../types';

export const generatePayslipPDF = (record: PayrollRecord, period: PayrollPeriod) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado Corporativo
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Título de la Empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTADORA RIVERO S.R.L.', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('NIT: 1029384019 | Av. Principal Zona Comercial Nro. 520', 14, 25);
  doc.text('Sistema de Control Salarial y Recursos Humanos', 14, 31);

  // Badge de Boleta
  doc.setFillColor(2, 132, 199); // brand-500
  doc.roundedRect(pageWidth - 65, 12, 51, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BOLETA DE PAGO', pageWidth - 60, 21);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº RECIBO: ${record.id.toUpperCase().slice(0, 8)}`, pageWidth - 60, 27);

  // Datos del Empleado y Periodo
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL TRABAJADOR Y PERIODO', 14, 52);

  // Cuadro informativo
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 56, pageWidth - 28, 40, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Trabajador:', 18, 64);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.employee.lastName}, ${record.employee.firstName}`, 45, 64);

  doc.setFont('helvetica', 'bold');
  doc.text('C.I. / DNI:', 18, 72);
  doc.setFont('helvetica', 'normal');
  doc.text(record.employee.dni, 45, 72);

  doc.setFont('helvetica', 'bold');
  doc.text('Cargo / Puesto:', 18, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(record.employee.position, 45, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('Departamento:', 18, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(record.employee.department, 45, 88);

  // Columna Derecha de la ficha
  const colRight = 115;
  doc.setFont('helvetica', 'bold');
  doc.text('Modalidad de Cobro:', colRight, 64);
  doc.setFont('helvetica', 'normal');
  doc.text(
    record.employee.paymentFrequency === 'SEMANAL' ? 'SEMANAL (7 Días)' : 'MENSUAL (30 Días)',
    colRight + 38,
    64
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Periodo Liquidado:', colRight, 72);
  doc.setFont('helvetica', 'normal');
  doc.text(period.name, colRight + 38, 72);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Emisión:', colRight, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('es-ES'), colRight + 38, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('Método de Pago:', colRight, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(record.employee.bankName || 'Efectivo en Caja', colRight + 38, 88);

  // Tabla de Conceptos
  const earnings = record.items.filter((i) => i.type === 'EARNING');
  const deductions = record.items.filter((i) => i.type === 'DEDUCTION');

  const maxRows = Math.max(earnings.length, deductions.length);
  const tableRows: any[] = [];

  for (let i = 0; i < maxRows; i++) {
    const earn = earnings[i];
    const ded = deductions[i];
    tableRows.push([
      earn ? earn.name : '',
      earn ? `Bs ${Number(earn.amount).toFixed(2)}` : '',
      ded ? ded.name : '',
      ded ? `Bs ${Number(ded.amount).toFixed(2)}` : '',
    ]);
  }

  // Totales en tabla
  tableRows.push([
    'TOTAL INGRESOS (HABERES)',
    `Bs ${Number(record.totalEarnings).toFixed(2)}`,
    'TOTAL DESCUENTOS',
    `Bs ${Number(record.totalDeductions).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 104,
    head: [['INGRESOS / HABERES', 'MONTO', 'DESCUENTOS / ADELANTOS', 'MONTO']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 55 },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] },
    },
    didParseCell: (data) => {
      // Resaltar fila de totales
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Cuadro de Neto a Pagar
  doc.setFillColor(236, 253, 245); // green-50
  doc.setDrawColor(16, 185, 129); // green-500
  doc.roundedRect(pageWidth - 90, finalY, 76, 22, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70); // green-800
  doc.text('LÍQUIDO PAGABLE (NETO):', pageWidth - 85, finalY + 8);
  doc.setFontSize(14);
  doc.text(`Bs ${Number(record.netAmount).toFixed(2)}`, pageWidth - 85, finalY + 17);

  // Espacio para Firmas
  const signatureY = finalY + 45;

  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);

  // Firma Empleador
  doc.line(24, signatureY, 84, signatureY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('IMPORTADORA RIVERO S.R.L.', 30, signatureY + 5);
  doc.text('Firma y Sello de la Empresa', 33, signatureY + 9);

  // Firma Empleado
  doc.line(pageWidth - 84, signatureY, pageWidth - 24, signatureY);
  doc.text(`${record.employee.lastName}, ${record.employee.firstName}`, pageWidth - 80, signatureY + 5);
  doc.text(`C.I.: ${record.employee.dni} (Firma de Conformidad)`, pageWidth - 78, signatureY + 9);

  // Pie de página
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Comprobante emitido por Sistema ImportRivero - Documento válido como constancia de pago salarial.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Descargar archivo
  const fileName = `Boleta_${record.employee.lastName.replace(/\s+/g, '_')}_${period.code}.pdf`;
  doc.save(fileName);
};
