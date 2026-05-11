import type { CoreUISlots } from '../context/CoreUIContext';
import useCoreUIContext from './useCoreUIContext';

const EMPTY: CoreUISlots = {};

const useCoreUISlots = (): CoreUISlots => {
  const { slots } = useCoreUIContext();
  return slots ?? EMPTY;
};

export default useCoreUISlots;
