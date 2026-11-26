// Link React Icons:
// https://react-icons.github.io/react-icons/

// Link Lucide:
// https://lucide.dev/icons/

import { SVGProps } from 'react';

// Tipagem comum
type IconProps = SVGProps<SVGSVGElement>;

// Ícones customizados (SVGs puros)
// Se tiver mais de 2 ou 3 ícones customizados, o ideal é movê-los para arquivos separados (ex: FilePdfIcon.tsx)
export const FilePdfIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 576 512" fill="currentColor" {...props}>
    <path d="M208 48L96 48c-8.8 0-16 7.2-16 16l0 384c0 8.8 7.2 16 16 16l80 0 0 48-80 0c-35.3 0-64-28.7-64-64L32 64C32 28.7 60.7 0 96 0L229.5 0c17 0 33.3 6.7 45.3 18.7L397.3 141.3c12 12 18.7 28.3 18.7 45.3l0 149.5-48 0 0-128-88 0c-39.8 0-72-32.2-72-72l0-88zM348.1 160L256 67.9 256 136c0 13.3 10.7 24 24 24l68.1 0zM240 380l32 0c33.1 0 60 26.9 60 60s-26.9 60-60 60l-12 0 0 28c0 11-9 20-20 20s-20-9-20-20l0-128c0-11 9-20 20-20zm32 80c11 0 20-9 20-20s-9-20-20-20l-12 0 0 40 12 0zm96-80l32 0c28.7 0 52 23.3 52 52l0 64c0 28.7-23.3 52-52 52l-32 0c-11 0-20-9-20-20l0-128c0-11 9-20 20-20zm32 128c6.6 0 12-5.4 12-12l0-64c0-6.6-5.4-12-12-12l-12 0 0 88 12 0zm76-108c0-11 9-20 20-20l48 0c11 0 20 9 20 20s-9 20-20 20l-28 0 0 24 28 0c11 0 20 9 20 20s-9 20-20 20l-28 0 0 44c0 11-9 20-20 20s-20-9-20-20l0-128z" />
  </svg>
);

// Exportação limpa e semântica da biblioteca react-icons
export {
  // Navegação e Layout
  LuMenu as MenuIcon,
  LuHouse as HouseIcon,

  // Usuários
  LuUser as UserIcon,
  LuUsers as UsersIcon,
  LuUserSearch as UserSearchIcon,
  LuUserRoundPen as UserEditIcon,
  LuUserCog as UserCogIcon,
  LuUserPlus as UserPlusIcon,
  LuUserCheck as UserCheckIcon,

  // Arquivos e Relatórios
  LuFileText as FileTextIcon,
  LuClipboard as ClipboardIcon,
  LuFileCog as FileCogIcon,

  // Ações e Ferramentas
  LuPlus as PlusIcon,
  LuSquarePen as EditIcon,
  LuTrash2 as TrashIcon,
  LuSearch as SearchIcon,
  LuPrinter as PrinterIcon,
  LuWrench as WrenchIcon, // Chave inglesa
  LuEraser as EraserIcon,
  LuCopy as CopyIcon,
  LuSend as SendIcon,
  LuDownload as DownloadIcon,

  // Setas e Direções
  LuChevronDown as ChevronDownIcon,
  LuChevronLeft as ChevronLeftIcon,
  LuChevronRight as ChevronRightIcon,
  LuChevronFirst as ChevronFirstIcon,
  LuChevronLast as ChevronLastIcon,

  // Visualização
  LuEye as EyeIcon,
  LuEyeClosed as EyeClosedIcon,
  LuEyeOff as EyeOffIcon,
  LuExternalLink as ExternalLinkIcon,

  // Segurança e Alertas
  LuShieldCheck as ShieldCheckIcon,
  LuShieldAlert as ShieldAlertIcon,
  LuTriangleAlert as TriangleAlertIcon,
  LuLock as LockIcon,
  LuKey as KeyIcon,
  LuLogOut as LogOutIcon,

  // Outros
  LuCar as CarIcon,
  LuPackage as PackageIcon,
  LuInfo as InfoIcon,
  LuMail as MailIcon,
  LuCheck as CheckIcon,
  LuX as CloseIcon,
  LuCircleMinus as CircleMinusIcon,
} from "react-icons/lu";
