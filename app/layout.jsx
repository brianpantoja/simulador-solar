import "./globals.css";

export const metadata = {
  title: "Simulador Solar — Huila, Colombia",
  description: "Simulador técnico y financiero de sistemas de energía solar fotovoltaica. Calcula kWh, ROI, BTU, fracción solar y venta de excedentes a Electrohuila.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
