// The page container/provider is a host shell concern (it wires host-owned
// ExtraContent, layout CSS and the scroller global) and lives in the host.
// core-ui only owns the shared header-slot bridge so the host and the
// enterprise plugin resolve the SAME context instance and can portal into the
// same layout-owned header bar.
export {
  HeaderLeft,
  HeaderRight,
  HeaderSlotContext,
  usePageContentStyle,
  type HeaderSlotContextValue
} from './header-slot';
