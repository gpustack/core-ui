import { useRef, useState } from 'react';

interface ImageItem {
  uid: number | string;
  dataUrl: string;
}

interface UseAddImageOptions {
  handleUpdateImgList: (list: ImageItem[]) => void;
  updateUidCount: () => number | string;
}

/**
 * Owns the interaction state for the "add image" flow (file picker dropdown +
 * add-by-url input). It returns only state and handlers — render the UI with
 * the `UploadImageButton` and `ImageURLInput` components, wiring these handlers
 * to them. This keeps the logic reusable and lets the UI be memoized/composed
 * by the consumer.
 */
const useAddImage = (options: UseAddImageOptions) => {
  const { handleUpdateImgList, updateUidCount } = options;
  const [isFromUrl, setIsFromUrl] = useState(false);
  const [openImgTips, setOpenImgTips] = useState(false);
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const inputImgRef = useRef<any>(null);

  const handleOnOpenChange = (open: boolean) => {
    setDropDownOpen(open);
  };

  const handleAddImgFromUrl = () => {
    setIsFromUrl(true);
    setTimeout(() => {
      inputImgRef.current?.focus?.();
    }, 100);
  };

  const handleInputImageUrl = async (e: any) => {
    const url = e.target.value?.trim();

    if (url) {
      handleUpdateImgList([
        {
          uid: updateUidCount(),
          dataUrl: url
        }
      ]);
      setOpenImgTips(false);
      setIsFromUrl(false);
    } else {
      setOpenImgTips(true);
    }
    // set openImgTips to false after next frame if is not valid
    if (!url) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setOpenImgTips(false);
        }, 3000);
      });
    }
  };

  const handleClose = (e?: any) => {
    e?.stopPropagation();
    setIsFromUrl(false);
    setOpenImgTips(false);
  };

  const handleOnEscape = (e: any) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return {
    isFromUrl,
    dropDownOpen,
    openImgTips,
    inputImgRef,
    handleAddImgFromUrl,
    handleInputImageUrl,
    handleClose,
    handleOnEscape,
    handleOnOpenChange
  };
};

export default useAddImage;
