import { Col, Row } from 'antd';
import ResizeObserver from 'rc-resize-observer';
import useResponsive, {
  type ResponsiveSpans
} from '../../hooks/use-responsive';

interface ResizeObserverContainerProps {
  dataList: any[];
  renderItem: (data: any) => React.ReactNode;
  defaultSpan?: number;
  /** Replaces the default spans with spans by Ant Design container breakpoint. */
  span?: ResponsiveSpans;
  resizable?: boolean;
}

const ResizeContainer: React.FC<ResizeObserverContainerProps> = ({
  defaultSpan = 8,
  dataList,
  renderItem,
  span: responsiveSpan,
  resizable = true
}) => {
  const { span, handleResize } = useResponsive({
    defaultSpan,
    span: responsiveSpan
  });

  return (
    <ResizeObserver onResize={handleResize} disabled={!resizable}>
      <Row gutter={[16, 16]}>
        {dataList.map((item: any, index) => {
          return (
            <Col span={span} key={item.id || index}>
              {renderItem(item)}
            </Col>
          );
        })}
      </Row>
    </ResizeObserver>
  );
};

export default ResizeContainer;
