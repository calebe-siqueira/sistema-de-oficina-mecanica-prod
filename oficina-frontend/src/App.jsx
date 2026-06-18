import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, useRef } from 'react';

// Components:
import Button from './components/Button';
import Input from './components/Input';
import Select from './components/Select';
import Pagination from './components/Pagination';
import { SystemToastContainer, toastify } from './components/SystemMessages';

import { AuthContext } from './context/AuthContext';
import { NavigationContext } from './context/NavigationContext';

// Features:
import OSItemsList from './features/OSItemList';
import ServiceOrderList from './features/ServiceOrderList';
import VehicleList from './features/VehicleList';

// Views:
import UsersView from './screens/views/UsersView';
import AuditsView from './screens/views/AuditsView';
import TrashView from './screens/views/TrashView';

// Screens:
import { TelaLogin } from './screens/TelaLogin';

// Icons:
import { LuMenu, LuHouse, LuUsers, LuCar, LuFileText, LuClipboard, LuShieldCheck, LuLogOut, LuPlus, LuSquarePen, LuTrash2, LuSearch, LuChevronLeft, LuChevronRight, LuPrinter, LuPackage, LuWrench, LuEye, LuEraser, FilePdf } from './components/Icons';

// Utils:
import { ESTADOS_BRASIL, ITEMS_PER_PAGE_OPTIONS, STATUS_MAP } from './utils/constants';
import { maskPlaca } from './utils/maskPlaca';


// --- Máscaras & Utilidades (Blindadas contra nulos) ---
export const formatSafeDate = (val) => {
  if (!val) return '';
  try {
    if (typeof val === 'string') {
      // 1. Trata formato ISO (ex: 1995-05-26T00:00:00)
      if (val.includes('T')) return val.split('T')[0];
      
      // 2. Trata formato brasileiro (ex: 26/05/1995) convertendo para yyyy-MM-dd
      if (val.includes('/')) {
        const [day, month, year] = val.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      return val;
    }
    if (typeof val === 'number') return new Date(val).toISOString().split('T')[0];
    if (Array.isArray(val)) return `${val[0]}-${String(val[1] || '').padStart(2, '0')}-${String(val[2] || '').padStart(2, '0')}`;
    if (val instanceof Date) return val.toISOString().split('T')[0];
  } catch (e) { console.error("Erro ao formatar data:", val, e); }
  return '';
};

const maskCpfCnpj = (v) => {
  if (!v || String(v) === 'null' || String(v) === 'undefined') return '';
  let val = String(v).replace(/\D/g, '');
  if (val.length <= 11) return val.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
  return val.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2').slice(0, 18);
};

const maskCep = (v) => {
  if (!v || String(v) === 'null' || String(v) === 'undefined') return '';
  return String(v).replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
};

const maskPhone = (v) => {
  if (!v || String(v) === 'null' || String(v) === 'undefined') return '';

  let val = String(v).replace(/\D/g, '');
  if (val.length === 0) return '';

  // --- MÁSCARA SEM DDD (Até 9 dígitos) ---
  if (val.length <= 9) {
    // Até 4 dígitos (Fixo ou início de celular): 9999
    if (val.length <= 4) return val;

    // Até 8 dígitos (Telefone Fixo padrão): 3333-4444
    if (val.length <= 8) return `${val.slice(0, 4)}-${val.slice(4)}`;

    // 9 dígitos (Celular padrão): 99999-4444
    return `${val.slice(0, 5)}-${val.slice(5, 9)}`;
  }

  // --- MÁSCARA COM DDD (10 ou 11 dígitos) ---
  if (val.length <= 10) {
    return `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
  }
  return `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7, 11)}`;
};

// --- Validações ---
function validarCpf(cpf) { if (!cpf) return false; const strCPF = String(cpf).replace(/\D/g, ''); if (strCPF.length !== 11 || /^(\d)\1{10}$/.test(strCPF)) return false; try { let soma = 0, aux = 10; for (let i = 0; i < 9; i++) soma += parseInt(strCPF.charAt(i)) * aux--; let digito1 = soma % 11; digito1 = (digito1 < 2) ? 0 : 11 - digito1; soma = 0; aux = 11; for (let i = 0; i < 10; i++) soma += parseInt(strCPF.charAt(i)) * aux--; let digito2 = soma % 11; digito2 = (digito2 < 2) ? 0 : 11 - digito2; const digitoVerificador = parseInt(strCPF.substring(9)); const digitoCalculado = (digito1 * 10) + digito2; return digitoVerificador === digitoCalculado; } catch (e) { return false; } }
function validarCnpj(cnpj) { if (!cnpj) return false; const strCNPJ = String(cnpj).replace(/\D/g, ''); if (strCNPJ.length !== 14 || /^(\d)\1{13}$/.test(strCNPJ)) return false; try { const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let soma = 0; for (let i = 0; i < 12; i++) soma += parseInt(strCNPJ.charAt(i)) * pesos1[i]; let digito1 = soma % 11; digito1 = (digito1 < 2) ? 0 : 11 - digito1; const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; soma = 0; for (let i = 0; i < 13; i++) soma += parseInt(strCNPJ.charAt(i)) * pesos2[i]; let digito2 = soma % 11; digito2 = (digito2 < 2) ? 0 : 11 - digito2; const digitoVerificador = parseInt(strCNPJ.substring(12)); const digitoCalculado = (digito1 * 10) + digito2; return digitoVerificador === digitoCalculado; } catch (e) { return false; } }

const isPhoneComplete = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 11;
};

const isCepComplete = (value) => String(value || '').replace(/\D/g, '').length === 8;

const isPlacaComplete = (value) => String(value || '').replace(/[^A-Z0-9]/gi, '').length === 7;

const getBirthDateRange = () => {
  const today = new Date();

  // Subtrai 10 anos da data atual (idade mínima para fazer o cadastro é 10 anos)
  today.setFullYear(today.getFullYear() - 10);
  const max = today.toISOString().split('T')[0];

  // Define a data mínima de nascimento como 01/01/1900
  const min = '1900-01-01';
  return [min, max];
};

const getOsDateRange = (ano_fabricacao) => {
  const today = new Date();

  // Data da OS não pode ser maior que hoje (futura)
  const max = today.toLocaleDateString('sv-SE');

  // Data da OS não pode ser menor que o ano de fabricação do veículo
  let min = '1886-01-01'; // Data da criação do primeiro automóvel como fallback

  if (ano_fabricacao) {
    min = `${parseInt(ano_fabricacao.toString().substring(0, 4)) - 1}-01-01`;
  }
  return [min, max];
};

const dateInRange = (value, min, max) => {
  if (!value) return false;
  return value >= min && value <= max;
};

// --- Hooks ---
// Erro de API com status HTTP e dados estruturados do corpo da resposta
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const useApi = () => {
  const { token, logout } = useContext(AuthContext);
  const request = useCallback(async (endpoint, method = 'GET', body = null) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);
      const response = await fetch(`/api${endpoint}`, options);
      if (response.status === 401) { logout(); throw new ApiError('Sessão expirada ou acesso negado.', 401, null); }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Erro ${response.status}` }));
        throw new ApiError(errData.message || `Erro ${response.status}`, response.status, errData);
      }
      if (response.status === 204) return null;
      return response.json();
    } catch (error) { throw error; }
  }, [token, logout]);
  return request;
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  return { navigate: context.navigate, goBack: context.goBack };
};


const Card = React.forwardRef(({ children, className = '' }, ref) => (<div ref={ref} className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}> {children} </div>));
const CardHeader = ({ children, actions, className = '' }) => (<div className={`px-4 py-4 sm:px-6 border-b border-gray-200 flex justify-between items-center ${className}`}><h2 className="text-xl font-semibold text-gray-800">{children}</h2>{actions && <div className="flex-shrink-0 ml-4">{actions}</div>}</div>);
const CardContent = ({ children, className = '' }) => (<div className={`p-4 sm:p-6 ${className}`}> {children} </div>);

const Modal = ({ title, children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>
        <div className="p-4"> {children} </div>
      </div>
    </div>
  );
};


// --- Main Layout ---
const MainLayout = ({ children }) => {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const { logout, user } = useContext(AuthContext);
  const { navigate, currentView, params } = useContext(NavigationContext);

  const navItems = [
    { name: 'Dashboard', icon: LuHouse, view: 'dashboard' },
    { name: 'Clientes', icon: LuUsers, view: 'clients' },
    { name: 'Veículos', icon: LuCar, view: 'vehicles' },
    { name: 'Ordens de Serviço', icon: LuFileText, view: 'serviceOrders' },
    { name: 'Relatórios', icon: LuClipboard, view: 'reports' },

    // { name: 'Usuários', icon: LuUsers, view: 'users' },
    // { name: 'Auditoria', icon: LuShieldCheck, view: 'audits' },
    // { name: 'Lixeira', icon: LuTrash2, view: 'trash' },
  ];

  const isViewActive = (itemView) => {
    if (itemView === currentView) return true;
    if (itemView === 'clients' && (currentView === 'clientForm' || params?.selectClientForOS)) return true;
    if (itemView === 'serviceOrders' && currentView === 'serviceOrderForm') return true;
    return false;
  };

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar para telas grandes */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-gray-800">
        <div onClick={() => navigate('dashboard')} className="flex items-center justify-center h-16 bg-gray-900 text-white font-bold text-xl">Carbulab</div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <a key={item.name} href="#" onClick={(e) => { e.preventDefault(); navigate(item.view); }} className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isViewActive(item.view) ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <item.icon className="mr-3 h-6 w-6" /> {item.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm">Logado como:</p>
          <p className="text-white font-medium">{user?.nome_usuario || 'Usuário'}</p> {/* Alterar para exibir o nome e a função do usuário logado */}
          <Button variant="ghost" className="w-full mt-4 hover:bg-gray-700 hover:text-white" onClick={logout}> <LuLogOut className="mr-2 h-5 w-5" /> Sair </Button>
        </div>
      </div>


      {/* Topbar/Sidebar para telas pequenas */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Escurece a tela sobreposta quando a sidebar é aberta e permite clicar fora para fechar */}
        <div
          data-open={hamburgerOpen}
          onClick={() => setHamburgerOpen(false)}
          className="md:hidden bg-gradient-to-r from-gray-600 fixed top-0 left-0 right-0 bottom-0 z-[100] data-[open=false]:hidden">
        </div>

        {/* Topbar (contém o botão para abrir a sidebar e fazer logout) */}
        <header className="md:hidden flex justify-between items-center h-16 bg-gray-900 p-3 text-white z-[200]">
          <Button
            variant="ghost"
            title='Menu'
            className="hover:bg-gray-800 hover:text-white rounded-xl"
            onClick={() => hamburgerOpen ? setHamburgerOpen(false) : setHamburgerOpen(true)}
          >
            <LuMenu className="h-6 w-6" />
          </Button>
          <h1
            className="text-xl font-bold"
            onClick={() => navigate('dashboard')}
          >
            Carbulab
          </h1>
          <Button
            variant="ghost"
            title='Sair'
            className="hover:bg-gray-800 hover:text-white rounded-xl"
            onClick={logout}
          >
            <LuLogOut className="h-6 w-6" />
          </Button>
        </header>

        {/* Sidebar (menu hamburguer) */}
        <div data-open={hamburgerOpen} className="md:hidden flex flex-col w-64 h-[calc(100%-64px)] mt-16 bg-gray-800 absolute z-[200] data-[open=false]:hidden">
          <div className="flex-1 flex flex-col">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <a key={item.name} href="#" onClick={(e) => { e.preventDefault(); navigate(item.view); }} className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isViewActive(item.view) ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                  <item.icon className="mr-3 h-6 w-6" /> {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">Logado como:</p>
            <p className="text-white font-medium">{user?.nome_usuario || 'Usuário'}</p>
            <Button variant="ghost" className="w-full mt-4 hover:bg-gray-700 hover:text-white" onClick={logout}> <LuLogOut className="mr-2 h-5 w-5" /> Sair </Button>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};


// --- Tela de Relatórios (Reports) ---
const ReportsView = () => {
  const [allVehicles, setAllVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState('placa');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const api = useApi();
  const { token } = useContext(AuthContext);
  const { navigate } = useNavigation();

  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api('/veiculos');
        const vehiclesWithClientName = Array.isArray(data)
          ? data.map(v => ({ ...v, nome_cliente: v.nome_cliente ? v.nome_cliente : 'N/A' }))
          : [];
        setAllVehicles(vehiclesWithClientName);
        setFilteredVehicles(vehiclesWithClientName);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, [api]);

  const handleGenerateReport = async (vehicleId) => {
    if (!vehicleId) return;
    setReportLoading(true);
    setError('');
    try {
      toastify.loadingMessage("Gerando PDF...", vehicleId, 'info')
      const response = await fetch(`/api/veiculos/${vehicleId}/os/pdf`, {
        method: 'GET',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) {
        toastify.loadingMessage("Erro ao gerar PDF", vehicleId, 'error')
        const errText = await response.text();
        const message = errText || `Erro ${response.status}`;
        throw new Error(`Falha ao gerar PDF: ${message}`);
      }
      toastify.loadingMessage("PDF gerado com sucesso!", vehicleId, 'success')
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredVehicles(allVehicles);
      return;
    }
    const term = searchTerm.toLowerCase();
    const res = allVehicles.filter(v => {
      const cleanTerm = term.replace(/\D/g, '');
      switch (searchType) {
        case 'placa': return (v.placa || '').toLowerCase().includes(term);
        case 'montadora': return (v.montadora || '').toLowerCase().includes(term);
        case 'modelo': return (v.modelo || '').toLowerCase().includes(term);
        case 'ano': return String(v.ano || '').includes(term);
        case 'cor': return (v.cor || '').toLowerCase().includes(term);
        case 'nome': return (v.nome_cliente || '').toLowerCase().includes(term);
        case 'cpf_cnpj': return (v.cliente?.cpf_cnpj || '').replace(/\D/g, '').includes(cleanTerm);
        case 'telefone': return (v.cliente?.celular || v.cliente?.telefone || '').replace(/\D/g, '').includes(cleanTerm);
        default: return true;
      }
    });
    setFilteredVehicles(res);
  }, [searchTerm, searchType, allVehicles]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const visibleItems = useMemo(() => {
    return filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredVehicles, currentPage, itemsPerPage]);


  return (
    <Card>
      <CardHeader className='h-16' >Relatórios de Veículos</CardHeader>
      <CardContent>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
            {/* Filtros de busca de relatório de veículo */}
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setSearchTerm('');
                setSearchInput('');
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <optgroup label="Dados do veículo">
                <option value="placa">Placa</option>
                <option value="montadora">Montadora</option>
                <option value="modelo">Modelo</option>
                <option value="ano">Ano</option>
                <option value="cor">Cor</option>
              </optgroup>
              <optgroup label="Dados do cliente">
                <option value="nome">Nome</option>
                <option value="cpf_cnpj">CPF/CNPJ</option>
                <option value="telefone">Celular/Telefone</option>
              </optgroup>
            </Select>
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                if (val.length >= 3 || val.length === 0) {
                  setSearchTerm(val);
                  setCurrentPage(1);
                }
              }}
              className="w-full sm:w-auto flex-grow"
            />
            <Button type="submit" variant="primary" className="shrink-0"><LuSearch className="mr-2 h-5 w-5" /> Buscar</Button>
          </form>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
            <select className="border border-gray-300 rounded-md text-sm p-2 bg-white" value={itemsPerPage} onChange={handleItemsPerPageChange}>
              {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div>
            <VehicleList
              vehicles={visibleItems}
              view="reports"
              reportLoading={reportLoading}
              onGenerateReport={handleGenerateReport}
              onViewVehicle={(v) => {
                navigate('clientForm', {
                  clientId: v.fk_cod_cliente,
                  scrollToVehicles: true,
                  osSearchType: 'cod_veiculo',
                  osSearchTerm: String(v.cod_veiculo)
                });
              }}
            />

            <div className="flex justify-center mt-4 pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


// --- Dashboard ---
const Dashboard = () => {
  const { navigate } = useNavigation();
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [recentOS, setRecentOS] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let m = true;
    const f = async () => {
      try {
        const d = await api('/dashboard/stats');
        const osList = await api('/os');
        if (m) {
          setStats(d);
          setRecentOS(Array.isArray(osList) ? osList.slice(0, 5) : []);
        }
      } catch (e) {
        if (m) setError(e.message);
      }
    };
    f();
    return () => m = false;
  }, [api]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="bg-red-100 p-4 rounded text-red-700">Erro ao carregar o dashboard: {error}</div>
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Carregando painel de métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Clientes ativos', value: stats.clientesAtivos },
          { name: 'Veículos cadastrados', value: stats.veiculosCadastrados },
          { name: 'OSs em andamento', value: stats.osEmAndamento },
          { name: 'OSs concluídas (mês)', value: stats.osConcluidasMes },
        ].map(s => (
          <Card key={s.name}>
            <CardContent>
              <p className="text-sm font-medium text-gray-500 truncate">{s.name}</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>Ações rápidas</CardHeader>
          <CardContent className="space-y-3">
            <Button variant="primary" className="w-full" onClick={() => navigate('clients', { action: 'new' })}> <LuPlus className="mr-2 h-5 w-5" /> Novo cliente </Button>
            <Button variant="primary" className="w-full" onClick={() => navigate('clients')}> <LuSearch className="mr-2 h-5 w-5" /> Buscar cliente </Button>
            <Button variant="success" className="w-full" onClick={() => navigate('clients', { selectClientForOS: true })}> <LuPlus className="mr-2 h-5 w-5" /> Nova ordem de serviço </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Ordens de serviço recentes</CardHeader>
          <CardContent>
            {recentOS.length === 0 ? (
              <p className="text-gray-500">Nenhuma OS recente.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOS.map(os => (
                      <tr key={os.cod_OS} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('serviceOrderForm', { osId: os.cod_OS, vehicleId: os.fk_cod_veiculo, clientId: os.fk_cod_cliente })}>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">#{os.cod_OS}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 truncate max-w-[150px]">{os.nome_cliente}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{os.data_OS ? formatSafeDate(os.data_OS).split('-').reverse().join('/') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button variant="ghost" className="w-full mt-2 text-blue-600" onClick={() => navigate('serviceOrders')}>Ver todas as ordens</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Client List ---
const ClientList = ({ params }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState(params.searchType || 'nome');
  const [searchTerm, setSearchTerm] = useState(params.searchTerm || '');
  const [searchInput, setSearchInput] = useState(params.searchTerm || '');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [visibleCount, setVisibleCount] = useState(25);

  const { navigate } = useNavigation();
  const api = useApi();
  const { selectClientForOS } = params;

  const fetchClients = useCallback(async (st, tipo) => {
    setLoading(true); setError('');
    try {
      let ep = '/clientes';
      if (st) ep = `/clientes/search?term=${encodeURIComponent(st)}&type=${tipo}`;
      const d = await api(ep);
      setClients(Array.isArray(d) ? d : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchClients(searchTerm, searchType); }, [fetchClients, searchTerm, searchType]);
  useEffect(() => { if (params?.action === 'new') navigate('clientForm', { clientId: 'new' }); }, [params, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setVisibleCount(itemsPerPage);
    fetchClients(searchTerm, searchType);
  };

  const handleItemsPerPageChange = (e) => {
    const val = Number(e.target.value);
    setItemsPerPage(val);
    setVisibleCount(val);
  }

  const visibleClients = clients.slice(0, visibleCount);

  return (
    <Card>
      <CardHeader className='h-16' actions={!selectClientForOS && (<Button onClick={() => navigate('clientForm', { clientId: 'new' })}><LuPlus className="mr-2 h-5 w-5" /> Novo cliente</Button>)}>
        {selectClientForOS ? 'Selecione um cliente para a OS' : 'Clientes'}
        {/* {selectClientForVehicle ? 'Selecione um cliente para o veículo' : 'Clientes'} */}
      </CardHeader>
      <CardContent>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
            {/* Filtros de busca de cliente */}
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value)
                setSearchTerm('')
                setSearchInput('')
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <optgroup label="Dados do cliente">
                <option value="nome">Nome</option>
                <option value="cpf_cnpj">CPF/CNPJ</option>
                <option value="telefone">Celular/Telefone</option>
              </optgroup>
              <optgroup label="Dados do veículo">
                <option value="placa">Placa</option>
              </optgroup>
            </Select>
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val); // Seta o valor digitado no input
                if (val.length >= 3 || val.length === 0) {
                  setSearchTerm(val); // Seta o valor da busca quando tiver pelo menos 3 caracteres
                  // setCurrentPage(1);
                }
              }}
              className="w-full sm:w-auto flex-grow"
            />
            <Button type="submit" variant="primary" className="shrink-0"><LuSearch className="mr-2 h-5 w-5" /> Buscar</Button>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
              <select className="border border-gray-300 rounded-md text-sm p-2 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm" value={itemsPerPage} onChange={handleItemsPerPageChange}>
                {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading && <p>Carregando clientes...</p>}
        {error && <p className="text-red-600">Erro: {error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato (Cel/Tel)</th>
                  {searchType === 'placa' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa encontrada</th>}
                  <th className="sticky right-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase z-10 w-[66px] sm:w-[125px]">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleClients.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Nenhum cliente encontrado.</td></tr>
                ) : (
                  visibleClients.map(client => (
                    <tr key={client.cod_cliente} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.nome_cliente}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maskCpfCnpj(client.cpf_cnpj)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.celular ? maskPhone(client.celular) : (maskPhone(client.telefone) || '-')}</td>
                      {searchType === 'placa' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">{maskPlaca(client.placa_encontrada) || '-'}</td>
                      )}
                      <td className="sticky right-0 bg-transparent px-4 py-3 text-sm font-medium w-[125px] text-left z-10">
                        <div className="flex flex-col w-[66px] sm:min-w-[125px] sm:flex-row sm:items-center gap-2">
                          {selectClientForOS ? (
                            <Button
                              variant="floating"
                              className="bg-green-600 text-white hover:bg-green-700 text-xs py-2.5 px-3"
                              onClick={() => navigate('clientForm', { clientId: client.cod_cliente, scrollToVehicles: true })}
                            >
                              Selecionar
                            </Button>
                          ) : (
                            <Button
                              variant="floating"
                              className="bg-white hover:bg-blue-50 hover:text-blue-900"
                              onClick={() => navigate('clientForm', { clientId: client.cod_cliente })}
                              title="Ver cliente"
                            >
                              <LuEye className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {visibleCount < clients.length && (
              <div className="flex justify-center mt-4 pb-4">
                <Button variant="secondary" onClick={() => setVisibleCount(prev => prev + itemsPerPage)}>
                  Mostrar mais {itemsPerPage} registros
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Client Form ---
const ClientForm = ({ params }) => {
  const { clientId, scrollToVehicles } = params;
  const isNewClient = clientId === 'new';

  const initialClientState = useMemo(() => ({ nome_cliente: '', email: '', celular: '', telefone: '', cpf_cnpj: '', rg: '', data_nascimento: '', tipo: 'F' }), []);
  const initialAddressState = useMemo(() => ({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' }), []);

  const [client, setClient] = useState(initialClientState);
  const [address, setAddress] = useState(initialAddressState);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(!isNewClient);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [cpfCnpjInvalid, setCpfCnpjInvalid] = useState(false);

  const [addressError, setAddressError] = useState('');

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [osSearchType, setOsSearchType] = useState(params.osSearchType || 'cod_OS');
  const [osSearchTerm, setOsSearchTerm] = useState(params.osSearchTerm || '');
  const [osSearchInput, setOsSearchInput] = useState(params.osSearchTerm || '');
  const [osStartDate, setOsStartDate] = useState('');
  const [osEndDate, setOsEndDate] = useState('');
  const [osFilterStatus, setOsFilterStatus] = useState('Todas');
  const [osItemsPerPage, setOsItemsPerPage] = useState(25);

  const { navigate, goBack } = useNavigation();
  const api = useApi();
  const vehiclesSectionRef = useRef(null);

  const [minNascimento, maxNascimento] = useMemo(() => getBirthDateRange(), []);

  useEffect(() => {
    let isMounted = true;
    if (!isNewClient && clientId) {
      const fetchClientData = async () => {
        setLoading(true); setError('');
        try {
            const clientData = await api(`/clientes/${clientId}`);
            if (isMounted && clientData) {
              // Clonagem de segurança para não mutar acidentalmente objetos fora do estado
              const c = { ...(clientData.cliente || initialClientState) };
              clientData.data_nascimento = formatSafeDate(clientData.data_nascimento);
              clientData.cpf_cnpj = maskCpfCnpj(clientData.cpf_cnpj);
              clientData.celular = maskPhone(clientData.celular);
              clientData.telefone = maskPhone(clientData.telefone);
              setClient(clientData);
                const addr = { ...(clientData.endereco || initialAddressState) };
                addr.cep = maskCep(addr.cep);
                setAddress(addr);
                
                setVehicles(Array.isArray(clientData.veiculos) ? clientData.veiculos : []);
            }
        } catch (err) { 
            if (isMounted) setError(`Erro ao carregar: ${err.message}`); 
        } finally { 
            if (isMounted) setLoading(false); 
        }
      };
      fetchClientData();
    } else if (!clientId && !isNewClient) {
      setError('ID de cliente inválido');
      setLoading(false);
    } else {
      setLoading(false);
    }
    return () => { isMounted = false };
  }, [clientId, isNewClient, api]); // Dependências limpas

  useEffect(() => {
    if (scrollToVehicles && vehiclesSectionRef.current && !loading) {
      setTimeout(() => vehiclesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [scrollToVehicles, loading]);

  const validateCpfCnpj = () => {
    if (!client) return true;
    const cleanCpfCnpj = client.cpf_cnpj ? String(client.cpf_cnpj).replace(/\D/g, '') : '';
    if (!cleanCpfCnpj) { return true; }
    if (client.tipo === 'F') {
      if (!validarCpf(cleanCpfCnpj)) {
        setCpfCnpjInvalid(true);
        return false;
      }
    } else {
      if (!validarCnpj(cleanCpfCnpj)) {
        setCpfCnpjInvalid(true);
        return false;
      }
    }
    setCpfCnpjInvalid(false);
    return true;
  };

  const validateAddress = () => {
    if (!address) return true;
    const fields = [address.cep, address.logradouro, address.numero, address.bairro, address.cidade, address.uf];
    const hasAny = fields.some(f => f && String(f).trim() !== '');
    if (!hasAny) { setAddressError(''); return true; }
    if (address.cep && !isCepComplete(address.cep)) {
      setAddressError('CEP deve ter 8 dígitos.');
      return false;
    }
    const isComplete = address.cep && address.logradouro && (address.numero !== null && address.numero !== '') && address.bairro && address.cidade && address.uf;
    if (!isComplete) { setAddressError('Endereço incompleto. Todos os campos obrigatórios devem ser preenchidos corretamente.'); return false; }
    setAddressError(''); return true;
  };

  const handleClientChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cpf_cnpj') value = maskCpfCnpj(value);
    if (name === 'celular' || name === 'telefone') value = maskPhone(value);
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cep') value = maskCep(value);
    if (name === 'numero') {
      if (value === '') {
        value = '';
      } else {
        const parsed = parseInt(value, 10);
        value = Number.isNaN(parsed) ? '' : String(Math.max(0, parsed));
      }
    }
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const cleanCpfCnpj = client.cpf_cnpj ? String(client.cpf_cnpj).replace(/\D/g, '') : '';
  const clientHasValidPhone = (client.celular ? isPhoneComplete(client.celular) : false) || (client.telefone ? isPhoneComplete(client.telefone) : false);
  const clientPhonesValid = (!client.celular || isPhoneComplete(client.celular)) && (!client.telefone || isPhoneComplete(client.telefone));
  const isCpfCnpjValid = !cleanCpfCnpj || (client.tipo === 'F' ? validarCpf(cleanCpfCnpj) : validarCnpj(cleanCpfCnpj));
  const isValidBirthDate = !client.data_nascimento || dateInRange(client.data_nascimento, minNascimento, maxNascimento);
  const hasAnyAddress = [address.cep, address.logradouro, address.numero, address.bairro, address.cidade, address.uf].some(f => f && String(f).trim() !== '');
  const addressCepValid = !address.cep || isCepComplete(address.cep);
  const isAddressValid = !hasAnyAddress || (
    addressCepValid && address.logradouro && address.numero !== '' && address.bairro && address.cidade && address.uf
  );
  const isClientFormValid = client.nome_cliente.trim() !== '' && clientHasValidPhone && clientPhonesValid && isValidBirthDate && isAddressValid && isCpfCnpjValid;

  const handleCepSearch = async (e) => {
    const cep = String(e.target.value).replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddress(prev => ({ ...prev, cep: maskCep(data.cep), logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf, complemento: data.complemento || '' }));
          document.getElementById('numero')?.focus();
        } else {
          toastify.warningMessage("Não foi possível encontrar um endereço para o CEP informado")
        }
      } catch (err) {
        toastify.warningMessage("Não foi possível buscar o endereço pelo CEP")
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCpfCnpj() || !validateAddress()) return;

    setSaving(true);
    try {
      const payload = { 
        ...client,
        data_nascimento: formatSafeDate(client.data_nascimento) || null,
        cpf_cnpj: client.cpf_cnpj ? String(client.cpf_cnpj).replace(/\D/g, '') : null, 
        endereco: { ...address,
          cep: address.cep ? String(address.cep).replace(/\D/g, '') : null,
          numero: address.numero && address.numero !== "" ? parseInt(address.numero) : null
        }
      };
      if (!payload.endereco.cep) payload.endereco = {};

      if (isNewClient) {
        const newClientData = await api('/clientes', 'POST', payload);
        alert('Cliente criado!');
        navigate('clientForm', { clientId: newClientData.cod_cliente });
      } else {
        await api(`/clientes/${clientId}`, 'PUT', payload);
        alert('Cliente atualizado!');
      }
    } catch (err) { setError(`Erro ao tentar salvar o cliente: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDeleteClient = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client?.nome_cliente}? Esta ação removerá também os veículos e ordens de serviço associados.`)) {
      try {
        await api(`/clientes/${clientId}`, 'DELETE');
        alert('Cliente excluído com sucesso.');
        navigate('clients');
      } catch (err) { alert(`Erro ao excluir: ${err.message}`); }
    }
  };

  const handleOrderSearch = (e) => {
    e.preventDefault();
    setOsSearchTerm(osSearchInput);
  };

  if (loading && !isNewClient) return <p className="p-8">Carregando informações do cliente...</p>;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-between items-center">
          <Button variant="secondary" onClick={goBack}><LuChevronLeft className="mr-2 h-5 w-5" /> Voltar</Button>
          {!isNewClient && (
            <Button type="button" variant="trash" onClick={handleDeleteClient}><LuTrash2 className="mr-2 h-5 w-5" /> Excluir cliente</Button>
          )}
        </div>

        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        {addressError && <p className="text-red-600 bg-red-100 p-3 rounded-md">{addressError}</p>}

        <Card>
          <CardHeader>{isNewClient ? 'Novo cliente' : `Editando: ${client?.nome_cliente || ''}`}</CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Nome completo" id="nome_cliente" name="nome_cliente" value={client?.nome_cliente || ''} onChange={handleClientChange} required />
            <div className="w-full">
              <Input label="CPF/CNPJ" id="cpf_cnpj" name="cpf_cnpj" value={client?.cpf_cnpj || ''} onChange={handleClientChange} onBlur={validateCpfCnpj} invalid={cpfCnpjInvalid && client.cpf_cnpj} />
            </div>
            <Select label="Tipo" id="tipo" name="tipo" value={client?.tipo || 'F'} onChange={handleClientChange}>
              <option value="F">Pessoa Física</option>
              <option value="J">Pessoa Jurídica</option>
            </Select>
            <Input label="RG" id="rg" name="rg" value={client?.rg || ''} onChange={handleClientChange} />
            <Input label="Data de nascimento" id="data_nascimento" name="data_nascimento" type="date" value={client?.data_nascimento || ''} onChange={handleClientChange} min={minNascimento} max={maxNascimento} invalid={client?.data_nascimento && !isValidBirthDate} />
            <Input label="Celular" id="celular" name="celular" type="tel" value={client?.celular || ''} onChange={handleClientChange} required={!client?.telefone} placeholder="(99) 99999-9999" invalid={client?.celular && !isPhoneComplete(client.celular)} />
            <Input label="Telefone" id="telefone" name="telefone" type="tel" value={client?.telefone || ''} onChange={handleClientChange} required={!client?.celular} placeholder="(99) 9999-9999" invalid={client?.telefone && !isPhoneComplete(client.telefone)} />
            <Input label="E-mail" id="email" name="email" type="email" value={client?.email || ''} onChange={handleClientChange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Endereço</CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Input label="CEP" id="cep" name="cep" value={address?.cep || ''} onChange={(e) => { handleAddressChange(e); handleCepSearch(e); }} placeholder="00000-000" required={!!address.cep} invalid={address?.cep && !isCepComplete(address.cep)} />
            <Input label="Logradouro" id="logradouro" name="logradouro" value={address?.logradouro || ''} onChange={handleAddressChange} className="md:col-span-2 lg:col-span-3" required={!!address.cep} />
            <Input label="Número" id="numero" name="numero" type="number" min="0" step="1" value={address?.numero ?? ''} onChange={handleAddressChange} required={!!address.cep} invalid={address?.numero !== '' && parseInt(address.numero, 10) < 0} />
            <Input label="Complemento" id="complemento" name="complemento" value={address?.complemento || ''} onChange={handleAddressChange} />
            <Input label="Bairro" id="bairro" name="bairro" value={address?.bairro || ''} onChange={handleAddressChange} required={!!address.cep} />
            <Input label="Cidade" id="cidade" name="cidade" value={address?.cidade || ''} onChange={handleAddressChange} required={!!address.cep} />
            <Select label="UF" id="uf" name="uf" value={address?.uf || ''} onChange={handleAddressChange} required={!!address.cep}>
              <option value="">Selecione</option>
              {ESTADOS_BRASIL.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </Select>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={goBack} disabled={saving}> Cancelar </Button>
          <Button type="submit" variant="success" disabled={saving || loading || !isClientFormValid}> {saving ? 'Salvando...' : 'Salvar cliente'} </Button>
        </div>

        {!isNewClient && (
          <>
            <Card ref={vehiclesSectionRef} id="vehicles-section">
              <CardHeader actions={<Button type="button" onClick={() => { setSelectedVehicle(null); setVehicleModalOpen(true); }}> <LuPlus className="mr-2 h-5 w-5" /> Novo veículo </Button>}> Veículos </CardHeader>
              <CardContent>
                {(!Array.isArray(vehicles) || vehicles.length === 0) ? <p className="text-gray-500">Nenhum veículo cadastrado.</p> : (
                  <VehicleList
                    vehicles={vehicles}
                    view="clientForm"
                    osSearchType={osSearchType}
                    osSearchTerm={osSearchTerm}
                    onVehicleClick={(v) => {
                      setOsSearchType('cod_veiculo');
                      setOsSearchTerm(String(v.cod_veiculo));
                      setOsSearchInput(String(v.cod_veiculo));
                    }}
                    onCreateOs={(v) => {
                      navigate('serviceOrderForm', {
                        osId: 'new',
                        vehicleId: v.cod_veiculo,
                        clientId: clientId
                      })
                    }}
                    onEditVehicle={(v) => {
                      setSelectedVehicle(v);
                      setVehicleModalOpen(true);
                    }}
                    onDeleteVehicle={async (v) => {
                      //                  Excluir veículo ${v.placa}? + (typeof v.quantidade_OS === 'undefined' ? \nAtenção, isso também irá excluir as ${v.quantidade_OS} ordens de serviço associadas a ele. : '')
                      if (window.confirm(`Excluir veículo ${maskPlaca(v.placa)}?\nAtenção, isso também irá excluir as ${v.quantidade_OS || 0} ordens de serviço associadas a ele.`)) {
                        try { await api(`/veiculos/${v.cod_veiculo}`, 'DELETE'); setVehicles(prev => prev.filter(x => x.cod_veiculo !== v.cod_veiculo)); }
                        catch (err) { alert(`Erro: ${err.message}`); }
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>{osSearchType === 'cod_veiculo' && osSearchTerm !== '' ? `Ordens de serviço do veículo ${maskPlaca(vehicles.find(v => v.cod_veiculo === parseInt(osSearchTerm))?.placa) || ''}` : 'Ordens de serviço'}</CardHeader>
              <CardContent>
                <div className="flex flex-col xl:flex-row gap-4 w-full justify-between items-start xl:items-center mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
                    {/* Filtros de busca de OS dentro do cliente */}
                    <Select
                      value={osSearchType}
                      onChange={(e) => {
                        setOsSearchType(e.target.value)
                        setOsSearchTerm("");
                        setOsSearchInput("");
                        setOsStartDate("");
                        setOsEndDate("");
                      }}
                      className="w-full sm:w-48 shrink-0"
                    >
                      <optgroup label="Dados da OS">
                        <option value="cod_OS">Código</option>
                        <option value="data">Data</option>
                        <option value="intervalo_data">Intervalo de datas</option>
                      </optgroup>
                      <optgroup label="Dados do veículo">
                        <option value="placa">Placa</option>
                        <option value="montadora">Montadora</option>
                        <option value="modelo">Modelo</option>
                        <option value="ano">Ano</option>
                        <option value="cor">Cor</option>
                        <option value="cod_veiculo" className="hidden">Código do veículo</option>
                      </optgroup>
                    </Select>

                    <div className="flex flex-row gap-3 w-full sm:w-auto flex-grow">
                      {osSearchType === 'intervalo_data' ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Input type="date" value={osStartDate} onChange={e => setOsStartDate(e.target.value)} required />
                          <span className="text-gray-500 text-sm font-medium px-1">até</span>
                          <Input type="date" value={osEndDate} onChange={e => setOsEndDate(e.target.value)} required />
                        </div>
                      ) : osSearchType === 'data' ? (
                        <Input type="date" value={osSearchInput} onChange={e => { setOsSearchInput(e.target.value); setOsSearchTerm(e.target.value); }} className="w-full sm:w-auto flex-grow" required />
                      ) : (
                        <Input
                          type="text"
                          placeholder="Buscar..."
                          value={osSearchInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOsSearchInput(val);
                            if (val.length >= 3 || val.length === 0) {
                              setOsSearchTerm(val);
                              // setCurrentPage(1);
                            }
                          }}
                          className="w-full flex-grow sm:w-auto"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        title="Limpar filtros"
                        className="shrink-0 w-[54px] sm:w-auto"
                        onClick={() => {
                          setOsSearchTerm("");
                          setOsSearchInput("");
                          setOsStartDate("");
                          setOsEndDate("");
                          setOsFilterStatus("Todas");
                          setOsSearchType("cod_OS");
                        }}
                      >
                        <LuEraser className="h-5 w-5" />
                      </Button>
                    </div>

                    <Button
                      onClick={handleOrderSearch}
                      variant="primary"
                      className="shrink-0"
                    >
                      <LuSearch className="mr-2 h-5 w-5" />
                      Buscar
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
                    <Select value={osFilterStatus} onChange={(e) => setOsFilterStatus(e.target.value)} className="w-full sm:w-48 shrink-0">
                      <option value="Todas">Todos os Status</option>
                      <optgroup label="Status da Ordem">
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={`ord_${k}`} value={k}>{v}</option>)}
                      </optgroup>
                      <optgroup label="Status de Pagamento">
                        <option value="pag_pendente">Pagamento pendente</option>
                        <option value="pag_parcial">Pago parcialmente</option>
                        <option value="pag_pago">Pago integralmente</option>
                      </optgroup>
                    </Select>

                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
                      <select className="border border-gray-300 rounded-md text-sm p-2 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm" value={osItemsPerPage} onChange={(e) => setOsItemsPerPage(Number(e.target.value))}>
                        {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <ServiceOrderList
                  clientId={clientId}
                  searchType={osSearchType}
                  searchTerm={osSearchTerm}
                  startDate={osStartDate}
                  endDate={osEndDate}
                  filterStatus={osFilterStatus}
                  itemsPerPage={osItemsPerPage}
                  onEdit={(os) => navigate('serviceOrderForm', { osId: os.cod_OS, vehicleId: os.fk_cod_veiculo, clientId: clientId })}
                  view="osListForClient" // view ClientForm
                />

              </CardContent>
            </Card>
          </>
        )}
      </form>
      <VehicleFormModal isOpen={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} clientId={clientId} vehicle={selectedVehicle} onSaved={(v) => {
        setVehicleModalOpen(false); setSelectedVehicle(null);
        if (selectedVehicle) setVehicles(prev => prev.map(x => x.cod_veiculo === v.cod_veiculo ? v : x));
        else setVehicles(prev => [...prev, v]);
      }} />
    </>
  );
};


// --- Vehicle List View (Sidebar Tab) ---
const VehicleListView = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState('placa');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [visibleCount, setVisibleCount] = useState(25);
  const api = useApi();
  const { navigate } = useNavigation();

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/veiculos');
      const arr = Array.isArray(data) ? data : [];
      setVehicles(arr);
      setFilteredVehicles(arr);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => {
    const res = vehicles.filter(v => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      switch (searchType) {
        case 'placa': return (v.placa || '').toLowerCase().includes(term);
        case 'montadora': return (v.montadora || '').toLowerCase().includes(term);
        case 'modelo': return (v.modelo || '').toLowerCase().includes(term);
        case 'ano': return String(v.ano || '').includes(term);
        case 'cor': return (v.cor || '').toLowerCase().includes(term);
        case 'nome_cliente': return (v.nome_cliente || '').toLowerCase().includes(term);
        default: return true;
      }
    });
    setFilteredVehicles(res);
  }, [searchTerm, searchType, vehicles]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleItemsPerPageChange = (e) => {
    const val = Number(e.target.value);
    setItemsPerPage(val);
    setVisibleCount(val);
  }

  const visibleVehicles = filteredVehicles.slice(0, visibleCount);

  return (
    <Card>

      {/* <CardHeader className='h-16' actions={<Button type="button" onClick={() => navigate('ClientForm', { setSelectedVehicle: null, setVehicleModalOpen: true, scrollToVehicles: true})}> <LuPlus className="mr-2 h-5 w-5" /> Novo veículo </Button>}> Veículos </CardHeader> */}
      {/* <CardHeader className='h-16' actions={<Button onClick={() => navigate('clients', { selectClientForOS: true })}> <LuPlus className="mr-2 h-5 w-5" /> Novo veículo </Button>}> Veículos </CardHeader> */}

      {/* VehicleFormModal */}

      <CardHeader className='h-16' >Veículos</CardHeader>
      <CardContent>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
            {/* Filtros de busca de veículo */}
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setSearchTerm('');
                setSearchInput('');
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <optgroup label="Dados do veículo">
                <option value="placa">Placa</option>
                <option value="montadora">Montadora</option>
                <option value="modelo">Modelo</option>
                <option value="ano">Ano</option>
                <option value="cor">Cor</option>
              </optgroup>
              <optgroup label="Dados do cliente">
                <option value="nome_cliente">Nome</option>
              </optgroup>
            </Select>
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                if (val.length >= 3 || val.length === 0) {
                  setSearchTerm(val);
                  setVisibleCount(itemsPerPage);
                  // setCurrentPage(1);
                }
              }}
              className="w-full sm:w-auto flex-grow"
            />
            <Button type="submit" variant="primary" className="shrink-0"><LuSearch className="mr-2 h-5 w-5" /> Buscar</Button>
          </form>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
            <select className="border border-gray-300 rounded-md text-sm p-2 bg-white" value={itemsPerPage} onChange={handleItemsPerPageChange}>
              {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {loading && <p>Buscando veículos...</p>}

        {!loading && (
          <VehicleList
            vehicles={filteredVehicles}
            itemsPerPage={itemsPerPage}
            view="vehicles"
            onCreateOs={(v) => {
              navigate('serviceOrderForm', {
                osId: 'new',
                vehicleId: v.cod_veiculo,
                clientId: v.fk_cod_cliente
              });
            }}
            onViewVehicle={(v) => {
              navigate('clientForm', {
                clientId: v.fk_cod_cliente,
                scrollToVehicles: true,
                osSearchType: 'cod_veiculo',
                osSearchTerm: String(v.cod_veiculo)
              });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

// --- Vehicle Form Modal ---
const VehicleFormModal = ({ isOpen, onClose, clientId, vehicle, onSaved }) => {
  const isNewVehicle = !vehicle;
  const initialFormState = useMemo(() => ({ placa: '', montadora: '', modelo: '', combustivel: '', ano: '', cor: '' }), []);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const api = useApi();

  useEffect(() => {
    if (isOpen) {
      setFormData(vehicle ? { ...vehicle, ano: parseInt(vehicle.ano, 10) || '' } : initialFormState);
      setError('');
    }
  }, [vehicle, isOpen, initialFormState]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'placa') value = maskPlaca(value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isVehicleYearValid = () => {
    const ano = parseInt(formData.ano, 10);
    return !Number.isNaN(ano) && ano >= 1886 && ano <= new Date().getFullYear() + 1;
  };

  const isVehicleFormValid = () => {
    return (
      formData.placa && isPlacaComplete(formData.placa) &&
      formData.montadora.trim() &&
      formData.modelo.trim() &&
      isVehicleYearValid() &&
      formData.cor.trim() &&
      String(formData.combustivel).trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    if (!isVehicleFormValid()) {
      setError('Preencha todos os campos obrigatórios corretamente antes de salvar o veículo.');
      setLoading(false);
      return;
    }
    try {
      const cleanPlaca = String(formData.placa).replace(/[.\- ]/g, '').toUpperCase();
      const payload = { ...formData, placa: cleanPlaca, ano: parseInt(formData.ano, 10), fk_cod_cliente: parseInt(clientId, 10) };

      if (isNewVehicle) {
        try {
          // Tenta criar o veículo; o backend faz toda a validação de placa
          const saved = await api(`/clientes/${clientId}/veiculos`, 'POST', payload);
          alert('Veículo salvo!');
          onSaved(saved);
        } catch (err) {
          // 409 = placa já existe para outro(s) cliente(s) → exibe confirmação
          if (err instanceof ApiError && err.status === 409 && err.data?.type === 'DUPLICATE_PLATE_OTHER_CLIENT') {
            if (!window.confirm(err.data.message)) { setLoading(false); return; }
            // Usuário confirmou: reenvia com force=true para ignorar o conflito
            const saved = await api(`/clientes/${clientId}/veiculos?force=true`, 'POST', payload);
            alert('Veículo salvo!'); // Alterar para mensagem Toast
            onSaved(saved);
          } else {
            // 400 (duplicata no mesmo cliente) ou outro erro → exibe mensagem
            throw err;
          }
        }
      } else {
        try {
          // Envia o clienteId para que o backend possa executar a validação de placa
          const saved = await api(`/veiculos/${vehicle.cod_veiculo}?clienteId=${clientId}`, 'PUT', payload);
          alert('Veículo salvo!');
          onSaved(saved);
        } catch (err) {
          // 409 = placa já existe para outro(s) cliente(s) → exibe confirmação
          if (err instanceof ApiError && err.status === 409 && err.data?.type === 'DUPLICATE_PLATE_OTHER_CLIENT') {
            if (!window.confirm(err.data.message)) { setLoading(false); return; }
            // Usuário confirmou: reenvia com force=true para ignorar o conflito
            const saved = await api(`/veiculos/${vehicle.cod_veiculo}?clienteId=${clientId}&force=true`, 'PUT', payload);
            alert('Veículo salvo!');
            onSaved(saved);
          } else {
            // 400 (duplicata no mesmo cliente) ou outro erro → exibe mensagem no formulário
            throw err;
          }
        }
      }
    } catch (err) { setError(err.message); } // Alterar para mensagem Toast
    finally { setLoading(false); }
  };

  return (
    <Modal title={isNewVehicle ? "Novo veículo" : `Editar veículo: ${vehicle?.placa}`} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Placa" id="placa" name="placa" value={formData.placa} onChange={handleChange} required invalid={formData.placa !== '' && !isPlacaComplete(formData.placa)} />
          <Input label="Montadora" id="montadora" name="montadora" value={formData.montadora} onChange={handleChange} required />
          <Input label="Modelo" id="modelo" name="modelo" value={formData.modelo} onChange={handleChange} required />
          <Input label="Ano" id="ano" name="ano" type="number" value={formData.ano} onChange={handleChange} required min="1886" max={new Date().getFullYear() + 1} invalid={formData.ano !== '' && !isVehicleYearValid()} />
          <Input label="Cor" id="cor" name="cor" value={formData.cor} onChange={handleChange} required />
          <Select label="Combustível" id="combustivel" name="combustivel" value={formData.combustivel} onChange={handleChange} required>
            <option value="">Selecione</option><option value="Gasolina">Gasolina</option><option value="Etanol">Etanol</option><option value="Flex">Flex</option><option value="Diesel">Diesel</option><option value="GNV">GNV</option><option value="Eletrico">Elétrico</option>
          </Select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}> Cancelar </Button>
          <Button type="submit" variant="primary" disabled={loading || !isVehicleFormValid()}> {loading ? 'Salvando...' : 'Salvar'} </Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Listagem de Ordens de Serviço ---
const AllServiceOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchType, setSearchType] = useState('codigo');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [filterStatus, setFilterStatus] = useState('Todas');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [visibleCount, setVisibleCount] = useState(25);

  const { navigate } = useNavigation();

  const handleSearch = (e) => { e.preventDefault(); };

  const handleItemsPerPageChange = (e) => {
    const val = Number(e.target.value);
    setItemsPerPage(val);
    setVisibleCount(val);
  }

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  return (
    <Card>
      <CardHeader className='h-16' actions={<Button onClick={() => navigate('clients', { selectClientForOS: true })}> <LuPlus className="mr-2 h-5 w-5" /> Nova OS </Button>}> Ordens de Serviço </CardHeader>
      <CardContent>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-grow">
            {/* Filtros de busca de OS */}
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setSearchTerm('');
                setSearchInput('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full sm:w-48 shrink-0"
            >
              <optgroup label="Dados da OS">
                <option value="codigo">Código</option>
                <option value="data">Data</option>
                <option value="intervalo_data">Intervalo de datas</option>
              </optgroup>
              <optgroup label="Dados do veículo">
                <option value="placa">Placa</option>
                <option value="montadora">Montadora</option>
                <option value="modelo">Modelo</option>
                <option value="ano">Ano</option>
                <option value="cor">Cor</option>
              </optgroup>
              <optgroup label="Dados do cliente">
                <option value="nome_cliente">Nome</option>
              </optgroup>
            </Select>

            {searchType === 'intervalo_data' ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                <span className="text-gray-500 text-sm font-medium px-1">até</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            ) : searchType === 'data' ? (
              <Input type="date" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto flex-grow" required />
            ) : (
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  if (val.length >= 3 || val.length === 0) {
                    setSearchTerm(val);
                    // setCurrentPage(1);
                  }
                }}
                className="w-full sm:w-auto flex-grow"
              />
            )}

            <Button type="submit" variant="primary" className="shrink-0"><LuSearch className="mr-2 h-5 w-5" /> Buscar</Button>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0 justify-end">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-48 shrink-0">
              <option value="Todas">Todos os status</option>
              <optgroup label="Status da ordem">
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={`ord_${k}`} value={k}>{v}</option>)}
              </optgroup>
              <optgroup label="Status de pagamento">
                <option value="pag_pendente">Pagamento pendente</option>
                <option value="pag_parcial">Pago parcialmente</option>
                <option value="pag_pago">Pago integralmente</option>
              </optgroup>
            </Select>

            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Exibição:</label>
              <select className="border border-gray-300 rounded-md text-sm p-2 bg-white" value={itemsPerPage} onChange={handleItemsPerPageChange}>
                {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 bg-red-100 p-3 text-red-700 rounded">Erro: {error} </div>}

        <ServiceOrderList
          clientId={null} // show client name in list
          searchType={searchType === 'codigo' ? 'cod_OS' : searchType}
          searchTerm={searchTerm}
          startDate={startDate}
          endDate={endDate}
          filterStatus={filterStatus}
          itemsPerPage={itemsPerPage}
          onEdit={(os) => navigate('serviceOrderForm', { osId: os.cod_OS, vehicleId: os.fk_cod_veiculo, clientId: os.fk_cod_cliente })}
          view="allOrders" // view AllServiceOrders
        />
      </CardContent>
    </Card>
  );
};

// --- Service Order Form ---
const ServiceOrderForm = ({ params, pdfLibsLoaded }) => {
  const { osId, vehicleId, clientId } = params;
  const isNewOS = osId === 'new';
  const { navigate, goBack } = useNavigation();
  const api = useApi();

  const [os, setOs] = useState({ data_OS: new Date().toISOString().split('T')[0], quilometragem: '', descricao: '', tipo_desconto: 'N', desconto: 0, fk_cod_veiculo: vehicleId });
  const [status, setStatus] = useState({ status_servico: 1, valor_pago: 0 });
  const [items, setItems] = useState([]);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [minDate, maxDate] = useMemo(() => getOsDateRange(vehicleInfo?.ano), [vehicleInfo?.ano]);

  const { subTotal, totalDesconto, totalFinal, paymentStatusLabel, paymentStatusColor } = useMemo(() => {
    const sub = items.reduce((acc, item) => (acc + (parseFloat(item.valor) || 0) * (parseFloat(item.quantidade) || 0)), 0);
    let desc = 0; const dVal = parseFloat(os.desconto) || 0;
    if (os.tipo_desconto === 'P') desc = (sub * (dVal / 100)); else if (os.tipo_desconto === 'V') desc = dVal;
    const final = Math.max(0, sub - desc);

    const paid = parseFloat(status.valor_pago) || 0;
    let pLabel = 'Pagamento pendente'; let pColor = 'bg-red-100 text-red-800';
    if (paid >= final && final > 0) { pLabel = 'Pago integralmente'; pColor = 'bg-green-100 text-green-800'; }
    else if (paid > 0) { pLabel = 'Pago parcialmente'; pColor = 'bg-yellow-100 text-yellow-800'; }
    else if (final === 0 && items.length > 0) { pLabel = 'Gratuito / Garantia'; pColor = 'bg-gray-100 text-gray-800'; }

    return { subTotal: sub.toFixed(2), totalDesconto: desc.toFixed(2), totalFinal: final.toFixed(2), paymentStatusLabel: pLabel, paymentStatusColor: pColor };
  }, [items, os.desconto, os.tipo_desconto, status.valor_pago]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setLoading(true); setError('');
      try {
        let currentVehicleId = vehicleId ? parseInt(vehicleId, 10) : null;
        if (!isNewOS) {
          const osData = await api(`/os/${osId}`);
          if (isMounted && osData) {
            setOs({ ...(osData.os || {}), data_OS: formatSafeDate(osData.os?.data_OS) });
            setStatus(osData.status || { status_servico: 1, valor_pago: 0 });
            setItems(Array.isArray(osData.items) ? osData.items : []);
            currentVehicleId = osData.os?.fk_cod_veiculo;
          }
        }
        if (currentVehicleId) {
          const vData = await api(`/veiculos/${currentVehicleId}/details`);
          if (isMounted && vData) { setVehicleInfo(vData.veiculo); setClientInfo(vData.cliente); }
        }
      } catch (err) { if (isMounted) setError(err.message); } finally { if (isMounted) setLoading(false); }
    };
    fetchInitialData();
    return () => { isMounted = false };
  }, [osId, vehicleId, isNewOS, api]);

  const handleOsChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quilometragem' || name === 'desconto') {
      const normalized = value === '' ? '' : String(value);
      const parsed = parseFloat(normalized);
      setOs(prev => ({ ...prev, [name]: normalized === '' ? '' : (Number.isNaN(parsed) ? '' : String(Math.max(0, parsed))) }));
      return;
    }
    setOs(prev => ({ ...prev, [name]: e.target.value }));
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'quantidade' || name === 'valor') {
      const parsed = parseFloat(value);
      nextValue = value === '' ? '' : (Number.isNaN(parsed) ? '' : String(Math.max(0, parsed)));
    }
    setItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], [name]: nextValue }; return n; });
  };

  const addItem = (tipo) => {
    const lastItem = items[items.length - 1];
    if (!lastItem || (lastItem.nome_item && lastItem.quantidade && lastItem.valor)) {
      setItems([...items, { nome_item: '', quantidade: 1, valor: 0.00, tipo: tipo }]);
    } else {
      toastify.warningMessage("Preencha os campos do item atual antes de adicionar um novo.");
    }
  }
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const handlePaymentChange = (val) => setStatus(prev => ({ ...prev, valor_pago: Math.max(0, parseFloat(val || 0)) }));

  const hasValidOsDate = dateInRange(os.data_OS, minDate, maxDate);
  const hasValidKm = os.quilometragem === '' || parseFloat(os.quilometragem) >= 0;
  const hasValidDiscount = os.desconto === '' || parseFloat(os.desconto) >= 0;
  const itemsValid = items.every(item => {
    if (!item.nome_item) return true;
    const quantidade = parseFloat(item.quantidade);
    const valor = parseFloat(item.valor);
    return !Number.isNaN(quantidade) && quantidade >= 0 && !Number.isNaN(valor) && valor >= 0;
  });
  const isServiceOrderValid = hasValidOsDate && hasValidKm && hasValidDiscount && itemsValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!hasValidOsDate) {
      setError('Data da OS inválida ou fora do intervalo permitido.');
      return;
    }
    if (!hasValidKm) {
      setError('Quilometragem não pode ser negativa.');
      return;
    }
    if (!hasValidDiscount) {
      setError('Desconto não pode ser negativo.');
      return;
    }
    if (!itemsValid) {
      setError('Itens da OS devem ter quantidade e valor válidos e não negativos.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        os: { ...os, data_OS: formatSafeDate(os.data_OS), quilometragem: parseInt(os.quilometragem || 0), desconto: parseFloat(os.desconto || 0), fk_cod_veiculo: parseInt(vehicleId || os.fk_cod_veiculo) },
        status: { ...status, status_servico: parseInt(status.status_servico), valor_pago: parseFloat(status.valor_pago) },
        items: items.filter(i => i.nome_item).map(i => ({ ...i, quantidade: parseFloat(i.quantidade), valor: parseFloat(i.valor) }))
      };
      if (isNewOS) {
        const newOS = await api(`/veiculos/${payload.os.fk_cod_veiculo}/os`, 'POST', payload);
        alert('OS Criada!'); navigate('serviceOrderForm', { osId: newOS.cod_OS, vehicleId: payload.os.fk_cod_veiculo });
      } else {
        await api(`/os/${osId}`, 'PUT', payload); alert('OS Atualizada!');
      }
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };


  const handlePrintPDF = async () => {
    if (isNewOS) {
      alert('Salve a ordem de serviço antes de gerar o PDF.');
      return;
    }

    setError('');
    try {
      const tokenValue = localStorage.getItem('authToken');
      const resp = await fetch(`/api/os/${osId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': tokenValue ? `Bearer ${tokenValue}` : undefined,
        },
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Falha ao gerar PDF (${resp.status}): ${text}`);
      }

      const blob = await resp.blob();
      const pdfUrl = URL.createObjectURL(blob);
      const newTab = window.open(pdfUrl, '_blank');
      if (!newTab) {
        throw new Error('O navegador bloqueou a abertura da nova aba. Permita pop-ups para continuar.');
      }
      newTab.focus();

      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    } catch (err) {
      setError(err.message || 'Erro ao gerar o PDF.');
    }
  };

  if (loading) return <p className="p-8">Carregando dados da OS...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <Button type="button" variant="secondary" onClick={goBack}> <LuChevronLeft className="mr-2 h-5 w-5" /> Voltar </Button>
        <h1 className="text-2xl font-bold text-gray-900"> {isNewOS ? 'Nova OS' : `OS Nº: ${os.cod_OS}`} </h1>
        <Button type="button" variant="ghost" className="text-blue-600" onClick={handlePrintPDF} disabled={!pdfLibsLoaded || isNewOS}> <LuPrinter className="mr-2 h-5 w-5" /> Gerar PDF </Button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">Erro: {error}</div>}

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Cliente</span>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{clientInfo?.nome_cliente}</p>
              {clientInfo && (
                <Button type="button" variant="ghost" className="p-1 text-blue-600 hover:text-blue-900" onClick={() => navigate('clientForm', { clientId: clientInfo.cod_cliente })} title="Ver cliente">
                  <LuEye className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Veículo</span>
            <p className="text-lg font-semibold capitalize">{vehicleInfo?.montadora} {vehicleInfo?.modelo} {vehicleInfo?.cor} {vehicleInfo?.ano && new Date(vehicleInfo.ano).getFullYear()}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Placa</span>
            <p className="text-lg font-semibold">{maskPlaca(vehicleInfo?.placa)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Dados da OS</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Data" id="data_OS" name="data_OS" type="date" value={os.data_OS || ''} onChange={handleOsChange} required min={minDate} max={maxDate} invalid={os.data_OS !== '' && !hasValidOsDate} />
            <Input label="KM" id="quilometragem" name="quilometragem" type="number" min="0" step="1" value={os.quilometragem} onChange={handleOsChange} invalid={os.quilometragem !== '' && !hasValidKm} />
            <Select label="Status" id="status_servico" name="status_servico" value={status.status_servico} onChange={e => setStatus({ ...status, status_servico: e.target.value })}>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea name="descricao" rows="3" value={os.descricao} onChange={handleOsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader actions={<Button type="button" onClick={() => addItem('P')}> <LuPlus className="mr-2 h-5 w-5" /> Peça </Button>}> <LuPackage className="mr-3 h-6 w-6 inline" /> Peças </CardHeader>
        <CardContent> <OSItemsList items={items} type="P" onItemChange={handleItemChange} onRemoveItem={removeItem} onAddItem={() => addItem('P')} /> </CardContent>
      </Card>

      <Card>
        <CardHeader actions={<Button type="button" onClick={() => addItem('S')}> <LuPlus className="mr-2 h-5 w-5" /> Serviço </Button>}> <LuWrench className="mr-3 h-6 w-6 inline" /> Serviços </CardHeader>
        <CardContent> <OSItemsList items={items} type="S" onItemChange={handleItemChange} onRemoveItem={removeItem} onAddItem={() => addItem('S')} /> </CardContent>
      </Card>

      <Card>
        <CardHeader>Pagamento</CardHeader>
        <CardContent className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex gap-4">
              <Select label="Tipo Desconto" name="tipo_desconto" value={os.tipo_desconto} onChange={handleOsChange} className="w-1/2">
                <option value="N">Nenhum</option>
                <option value="V">Valor (R$)</option>
                <option value="P">Porcentagem (%)</option>
              </Select>
              <Input label="Desconto" name="desconto" type="number" min="0" value={os.desconto} onChange={handleOsChange} className="w-1/2" invalid={os.desconto !== '' && !hasValidDiscount} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor pago</label>
              <div className="flex items-center mt-1">
                <Button type="button" variant="secondary" onClick={() => handlePaymentChange(parseFloat(status.valor_pago) - 1)}>-</Button>
                <div className="relative flex-grow mx-2">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">R$</span>
                  <input type="number" min="0" step="1" value={status.valor_pago} onChange={(e) => handlePaymentChange(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <Button type="button" variant="secondary" onClick={() => handlePaymentChange(parseFloat(status.valor_pago) + 1)}>+</Button>
              </div>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold ${paymentStatusColor}`}>
                {paymentStatusLabel}
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2 text-right bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between text-lg"><span className="font-medium text-gray-600">Subtotal:</span><span>R$ {subTotal}</span></div>
            <div className="flex justify-between text-lg"><span className="font-medium text-gray-600">Desconto:</span><span className="text-red-600">- R$ {totalDesconto}</span></div>
            <div className="flex justify-between text-2xl font-bold mt-2 pt-2 border-t"><span>TOTAL:</span><span className="text-blue-700">R$ {totalFinal}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="danger" onClick={goBack} disabled={saving}> Cancelar </Button>
        <Button type="submit" variant="success" disabled={saving || !isServiceOrderValid}> Salvar </Button>
      </div>
    </form>
  );
};

// --- App Main ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLibsLoaded, setPdfLibsLoaded] = useState(false);
  const [view, setView] = useState('dashboard');
  const [params, setParams] = useState({});
  const [history, setHistory] = useState([]);

  const navigate = useCallback((newView, newParams = {}) => {
    setHistory(prev => [...prev, { view, params }]);
    setView(newView);
    setParams(newParams);
    window.scrollTo(0, 0);
  }, [view, params]);

  const goBack = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev];
      const last = newHistory.pop();
      if (last) {
        setView(last.view);
        setParams(last.params);
        return newHistory;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${storedToken}` } });
          if (res.ok) {
            setToken(storedToken);
            setUser({ nome_usuario: 'Administrador' });
          } else {
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (e) {
          console.error("Erro na verificação de token:", e);
          setToken(storedToken);
        }
      }
      setLoading(false);
    };
    verifyToken();
    setPdfLibsLoaded(true);
  }, []);

  const authContextValue = useMemo(() => ({
    token, user,
    login: async (loginInput, senha) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginInput, senha })
      });

      if (response.status === 500) { // Erro interno do servidor (exemplo: backend offline)
        throw new Error('Erro no servidor. Tente novamente mais tarde.');
      }
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Credenciais inválidas.');

      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);
    },
    logout: () => { localStorage.removeItem('authToken'); setToken(null); setUser(null); },
  }), [token, user]);

  const navCtx = useMemo(() => ({ navigate, goBack, currentView: view, params }), [navigate, goBack, view, params]);

  if (loading) return <div>Carregando...</div>;

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'clients': return <ClientList params={params} />;
      case 'clientForm': return <ClientForm key={params.clientId} params={params} />;
      case 'vehicles': return <VehicleListView />;
      case 'serviceOrders': return <AllServiceOrders />;
      case 'serviceOrderForm': return <ServiceOrderForm key={params.osId} params={params} pdfLibsLoaded={pdfLibsLoaded} />;
      case 'reports': return <ReportsView />;
      case 'users': return <UsersView />;
      case 'audits': return <AuditsView />;
      case 'trash': return <TrashView />;
      default: return <Dashboard />;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <NavigationContext.Provider value={navCtx}>
        <SystemToastContainer />
        {!token ? <TelaLogin /> : <MainLayout>{renderView()}</MainLayout>}
      </NavigationContext.Provider>
    </AuthContext.Provider>
  );
}