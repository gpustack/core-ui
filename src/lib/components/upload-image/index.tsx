import { PictureOutlined } from '@ant-design/icons';
import { Button, Tooltip, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { type RcFile } from 'antd/es/upload';
import { debounce, round } from 'lodash';
import React, { useCallback, useRef } from 'react';
import { useIntl } from '../../../lib/hooks/useIntl';

const acceptImageType = ['image/png', 'image/jpg', 'image/jpeg'];

interface UploadImgProps {
  size?: 'small' | 'middle' | 'large';
  height?: number;
  width?: number;
  verifySize?: boolean;
  multiple?: boolean;
  drag?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  accept?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  /** Max file size in KB */
  maxSize?: number;
  handleUpdateImgList: (
    imgList: {
      dataUrl: string;
      uid: number | string;
      rawWidth: number;
      rawHeight: number;
    }[]
  ) => void;
}

const UploadImg: React.FC<UploadImgProps> = ({
  handleUpdateImgList,
  multiple = true,
  drag = false,
  disabled = false,
  children,
  icon,
  title,
  accept = acceptImageType.join(','),
  size = 'small',
  maxSize,
  width,
  height,
  verifySize = false
}) => {
  const intl = useIntl();
  const uploadRef = useRef<any>(null);

  const validateFile = useCallback(
    (file: RcFile): boolean => {
      const allowedTypes = accept.split(',').map((t) => t.trim());
      if (!allowedTypes.includes(file.type)) {
        message.error(
          intl.formatMessage(
            { id: 'common.file.format.limit' },
            { formats: allowedTypes.join(', ') }
          )
        );
        return false;
      }
      if (maxSize !== undefined && file.size > maxSize * 1024) {
        message.error(
          intl.formatMessage(
            { id: 'common.file.size.limit' },
            { size: `${maxSize}KB` }
          )
        );
        return false;
      }
      return true;
    },
    [accept, maxSize]
  );

  const getImgSize = useCallback(
    (url: string): Promise<{ rawWidth: number; rawHeight: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            rawWidth: round(img.width, 0),
            rawHeight: round(img.height, 0)
          });
        };
        img.onerror = () => {
          resolve({ rawWidth: 0, rawHeight: 0 });
        };
        img.src = url;
      });
    },
    []
  );

  const getBase64 = useCallback((file: RcFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const debouncedUpdate = debounce(
    (
      base64List: {
        dataUrl: string;
        uid: number | string;
        rawWidth: number;
        rawHeight: number;
      }[]
    ) => {
      handleUpdateImgList(base64List);
    },
    300
  );

  const handleChange = useCallback(
    async (info: any) => {
      const { fileList } = info;

      const newFileList = await Promise.all(
        fileList.map(
          async (
            item: UploadFile & { rawWidth: number; rawHeight: number }
          ) => {
            if (item.originFileObj && !item.url) {
              const base64 = await getBase64(item.originFileObj as RcFile);
              const { rawWidth, rawHeight } = await getImgSize(base64);
              if (width !== undefined && rawWidth !== width && verifySize) {
                message.error(
                  intl.formatMessage(
                    { id: 'common.image.limit.width' },
                    { width: `${width}px` }
                  )
                );
                return null;
              }
              if (height !== undefined && rawHeight !== height && verifySize) {
                message.error(
                  intl.formatMessage(
                    { id: 'common.image.limit.height' },
                    { height: `${height}px` }
                  )
                );
                return null;
              }

              item.url = base64;
              item.rawWidth = rawWidth;
              item.rawHeight = rawHeight;
            }
            return item;
          }
        )
      );

      if (newFileList.length > 0) {
        const base64List = newFileList
          .filter((sitem) => sitem?.url)
          .map((item: UploadFile & { rawHeight: number; rawWidth: number }) => {
            return {
              dataUrl: item.url as string,
              uid: item.uid,
              rawWidth: item.rawWidth,
              rawHeight: item.rawHeight
            };
          });

        debouncedUpdate(base64List);
      }
    },
    [debouncedUpdate, getBase64, width, height]
  );

  return (
    <>
      {drag ? (
        <Upload.Dragger
          ref={uploadRef}
          accept={accept}
          multiple={multiple}
          action="/"
          fileList={[]}
          beforeUpload={(file) => {
            if (!validateFile(file)) {
              return Upload.LIST_IGNORE;
            }
            return false;
          }}
          onChange={handleChange}
        >
          {children ?? (
            <Tooltip
              title={
                title ?? intl.formatMessage({ id: 'playground.img.upload' })
              }
            >
              <Button
                disabled={disabled}
                size={size}
                type="text"
                icon={icon ?? <PictureOutlined />}
              ></Button>
            </Tooltip>
          )}
        </Upload.Dragger>
      ) : (
        <Upload
          ref={uploadRef}
          accept={accept}
          multiple={multiple}
          action="/"
          fileList={[]}
          beforeUpload={(file) => {
            if (!validateFile(file)) {
              return Upload.LIST_IGNORE;
            }
            return false;
          }}
          onChange={handleChange}
        >
          {children ?? (
            <Tooltip
              title={
                title ?? intl.formatMessage({ id: 'playground.img.upload' })
              }
            >
              <Button
                disabled={disabled}
                size={size}
                type="text"
                icon={icon ?? <PictureOutlined />}
              ></Button>
            </Tooltip>
          )}
        </Upload>
      )}
    </>
  );
};

export default UploadImg;
