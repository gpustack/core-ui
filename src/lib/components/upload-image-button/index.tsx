import {
  LinkOutlined,
  PictureOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { useIntl } from '../../hooks/useIntl';
import DropDownActions from '../drop-down-actions';
import UploadImg from '../upload-image';

export interface UploadImageButtonProps {
  size?: 'small' | 'middle' | 'large';
  onOpenChange?: (open: boolean) => void;
  /** Receives images selected through the file picker */
  onUpdateImgList: (list: { uid: number | string; dataUrl: string }[]) => void;
  /** Switch the consumer into "add image from url" mode */
  onAddFromUrl: () => void;
}

const UploadImageButton: React.FC<UploadImageButtonProps> = ({
  size = 'middle',
  onOpenChange,
  onUpdateImgList,
  onAddFromUrl
}) => {
  const intl = useIntl();

  return (
    <DropDownActions
      onOpenChange={onOpenChange}
      placement={'topLeft'}
      menu={{
        items: [
          {
            label: (
              <UploadImg handleUpdateImgList={onUpdateImgList} size="middle">
                <UploadOutlined className="m-r-8" />
                {intl.formatMessage({ id: 'playground.img.upload' })}
              </UploadImg>
            ),
            key: 'upload_image'
          },
          {
            label: intl.formatMessage({
              id: 'playground.uploadImage.url.button'
            }),
            key: 'add_image_url',
            icon: <LinkOutlined />,
            onClick: onAddFromUrl
          }
        ]
      }}
    >
      <Button
        type="text"
        size={size}
        icon={<PictureOutlined />}
        onClick={(e) => {
          e.stopPropagation();
        }}
      ></Button>
    </DropDownActions>
  );
};

export default UploadImageButton;
