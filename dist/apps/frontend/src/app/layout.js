"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const AuthContext_1 = require("@/context/AuthContext");
const inter = (0, google_1.Inter)({ subsets: ["latin"], variable: "--font-inter" });
const sora = (0, google_1.Sora)({ subsets: ["latin"], variable: "--font-sora" });
exports.metadata = {
    title: "Galecto | Distributed Tracing SaaS",
    description: "Enterprise Distributed Tracing & Observability",
    icons: {
        icon: "/favicon.png",
    },
};
function RootLayout({ children, }) {
    return (<html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased text-slate-900">
        <AuthContext_1.AuthProvider>
          {children}
        </AuthContext_1.AuthProvider>
      </body>
    </html>);
}
