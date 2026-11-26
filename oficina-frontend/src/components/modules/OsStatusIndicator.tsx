import { getOsStatusConfig } from '../../utils/statusHelpers';

interface Props {
  status: number;
}

export const OsStatusIndicator = ({ status }: Props) => {
  const { color, text } = getOsStatusConfig(status);

  return (
    <div
      className="w-4 h-4 rounded-full mx-auto shadow-sm"
      style={{ backgroundColor: color }}
      title={text}
    />
  );
};
