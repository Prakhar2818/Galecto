"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [token, setToken] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        // Check for existing session
        const savedToken = localStorage.getItem('ag_token');
        const savedUser = localStorage.getItem('ag_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);
    const login = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('ag_token', newToken);
        localStorage.setItem('ag_user', JSON.stringify(newUser));
        router.push('/dashboard');
    };
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('ag_token');
        localStorage.removeItem('ag_user');
        router.push('/login');
    };
    return (<AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>);
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
