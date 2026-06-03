import React, { ChangeEvent } from 'react';
import { LuTrash2 } from '../components/Icons'; // Importando o ícone de lixeira
import Button from '../components/Button'; // Importando os componentes que criamos
import Input from '../components/Input';

// 1. Definimos a estrutura de um Item da Ordem de Serviço
interface OSItem {
  tipo: string;
  nome_item: string;
  quantidade: number | string;
  valor: number | string;
  [key: string]: any; // Permite outras propriedades que possam existir
}

// 2. Definimos as Props do componente
interface OSItemsListProps {
  items: OSItem[];
  type: string;
  onItemChange: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveItem: (index: number) => void;
}

const OSItemsList = ({ 
  items, 
  type, 
  onItemChange, 
  onRemoveItem 
}: OSItemsListProps) => {
  
  // Mapeamos para manter o índice original do array pai antes do filtro
  const itemsToRender = items
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => item.tipo === type);

  if (itemsToRender.length === 0) {
    return <p className="text-gray-500 py-4 text-center text-sm italic">Nenhum item adicionado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider">
            <th className="text-left pb-2 font-semibold">Item</th>
            <th className="w-24 pb-2 font-semibold text-center">Qtd</th>
            <th className="w-32 pb-2 font-semibold text-center">Valor (R$)</th>
            <th className="w-12 pb-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {itemsToRender.map((item) => (
            <tr key={item.originalIndex} className="hover:bg-gray-50 transition-colors">
              <td className="py-1 pr-2">
                <Input 
                  name="nome_item" 
                  value={item.nome_item} 
                  onChange={(e) => onItemChange(item.originalIndex, e)} 
                  placeholder="Descrição do item"
                />
              </td>
              <td className="py-1 px-1">
                <Input 
                  type="number" 
                  name="quantidade" 
                  min="0" 
                  step="1" 
                  value={item.quantidade} 
                  onChange={(e) => onItemChange(item.originalIndex, e)} 
                  className="text-center"
                />
              </td>
              <td className="py-1 px-1">
                <Input 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  name="valor" 
                  value={item.valor} 
                  onChange={(e) => onItemChange(item.originalIndex, e)} 
                  className="text-right"
                />
              </td>
              <td className="py-1 pl-2 text-right">
                <Button 
                  type="button" 
                  variant="ghost" 
                  title="Remover item"
                  onClick={() => onRemoveItem(item.originalIndex)} 
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <LuTrash2 className="h-4 w-4"/>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OSItemsList;



// const OSItemsList = ({ items, type, onItemChange, onRemoveItem }) => {
//   const itemsToRender = items.map((item, index) => ({ ...item, originalIndex: index })).filter(item => item.tipo === type);
//   if (itemsToRender.length === 0) return <p className="text-gray-500 py-2 text-center">Nenhum item.</p>;
//   return (
//     <table className="min-w-full">
//         <thead><tr><th className="text-left">Item</th><th className="w-24">Qtd</th><th className="w-32">Valor</th><th className="w-16"></th></tr></thead>
//         <tbody>
//             {itemsToRender.map((item) => (
//                 <tr key={item.originalIndex}>
//                     <td className="p-1"><Input name="nome_item" value={item.nome_item} onChange={(e) => onItemChange(item.originalIndex, e)} /></td>
//                     <td className="p-1"><Input type="number" name="quantidade" value={item.quantidade} onChange={(e) => onItemChange(item.originalIndex, e)} /></td>
//                     <td className="p-1"><Input type="number" step="0.01" name="valor" value={item.valor} onChange={(e) => onItemChange(item.originalIndex, e)} /></td>
//                     <td className="p-1"><Button type="button" variant="ghost" onClick={() => onRemoveItem(item.originalIndex)} className="text-red-500"><Trash2 className="h-4 w-4"/></Button></td>
//                 </tr>
//             ))}
//         </tbody>
//     </table>
//   );
// };