import { Switch, Field, Label } from '@headlessui/react';
import { Ref } from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  title?: string;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function ToggleSwitch({ label, checked, onChange, name, title, disabled, ref }: ToggleSwitchProps) {
  return (
    // O Field vincula o Label ao Switch automaticamente para acessibilidade
    <Field className="flex items-center justify-between gap-3 cursor-pointer select-none">
      <Label className="text-sm font-medium text-gray-900 cursor-pointer">
        {label}
      </Label>
      
      <Switch
        ref={ref}
        name={name}
        title={title}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        // O Headless UI v2 usa estados em atributos data-*, facilitando o estilo com Tailwind
        className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 data-[checked]:bg-blue-600 data-[disabled]:opacity-50"
      >
        {/* A bolinha interna do Switch */}
        <span
          className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out group-data-[checked]:translate-x-5 group-data-[checked]:rtl:-translate-x-5"
        />
      </Switch>
    </Field>
  );
}
