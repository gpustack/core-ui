import classNames from 'classnames';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import './index.less';

interface TransitionWrapProps {
  minHeight?: number;
  header?: React.ReactNode;
  variant?: 'bordered' | 'filled';
  children: React.ReactNode;
  setCollapsed?: (val: boolean) => void;
  ref?: any;
}
const TransitionWrapper: React.FC<TransitionWrapProps> = forwardRef(
  (props, ref) => {
    const {
      minHeight = 50,
      header,
      variant = 'bordered',
      children,
      setCollapsed
    } = props;
    const [isOpen, setIsOpen] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (contentRef?.current) {
        contentRef.current.style.minHeight = isOpen
          ? `${contentRef.current.scrollHeight || 0}px`
          : '0px';
      }
    }, [isOpen]);

    const toggleOpen = () => {
      setIsOpen(!isOpen);
      setCollapsed?.(!isOpen);
    };

    const setHeightByContent = () => {
      if (contentRef?.current) {
        contentRef.current.style.minHeight = `${contentRef.current.scrollHeight || 0}px`;
      }
    };

    useImperativeHandle(ref, () => {
      return {
        setHeightByContent
      };
    });

    return (
      <div
        className={classNames('transition-wrapper', {
          bordered: variant === 'bordered',
          filled: variant === 'filled'
        })}
      >
        <div
          onClick={toggleOpen}
          className="header"
          style={{
            // when content is closed, header should have minHeight
            height: minHeight
          }}
        >
          {header}
        </div>
        <div
          className="transition-content-wrapper"
          style={{
            height: isOpen ? 'auto' : 0,
            padding: isOpen ? '8px' : '0 8px'
          }}
          ref={contentRef}
        >
          <div className="transition-content">{children}</div>
        </div>
      </div>
    );
  }
);

export default TransitionWrapper;
