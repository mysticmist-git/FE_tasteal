import CollectionItemAddButton from '@/components/common/buttons/CollectionItemAddButton';
import { useCallback } from 'react';
import DirectionEditorItem, {
  DirectionEditorItemValue,
} from './DirectionEditorItem/DirectionEditorItem';

/**
 * Default direction to add to recipe
 */
const DEFAULT_DIRECTION: DirectionEditorItemValue = {
  step: 0,
  direction: '',
  imageFile: null,
};

function createDefaultDirection(step: number): DirectionEditorItemValue {
  return {
    ...DEFAULT_DIRECTION,
    step: step,
  };
}

type DirectionEditorProps = {
  directions: DirectionEditorItemValue[];
  onChange: (directions: DirectionEditorItemValue[]) => void;
  disabled: boolean;
};

const DirectionEditor: React.FC<DirectionEditorProps> = ({
  directions,
  onChange,
  disabled,
}) => {
  //#region Handlers

  const handleAdd = useCallback(() => {
    onChange([...directions, createDefaultDirection(directions.length + 1)]);
  }, [directions, onChange]);

  const handleItemValueChange = useCallback(
    (step: number, value: DirectionEditorItemValue) => {
      const cloned = [...directions];
      cloned.splice(
        directions.findIndex((dir) => dir.step === step),
        1,
        value
      );
      onChange(cloned);
    },
    [directions, onChange]
  );

  const handleRemoveItem = useCallback(
    (step) => {
      let cloned = [...directions];
      cloned.splice(
        directions.findIndex((dir) => dir.step === step),
        1
      );
      cloned = cloned.map((direction, index) => ({
        ...direction,
        step: index + 1,
      }));
      onChange(cloned);
    },
    [directions, onChange]
  );

  //#endregion

  return (
    <>
      {directions.map((dir, index) => (
        <DirectionEditorItem
          key={index}
          value={dir}
          onChange={(value) => handleItemValueChange(dir.step, value)}
          onRemove={() => handleRemoveItem(dir.step)}
          disabled={disabled}
        />
      ))}

      <CollectionItemAddButton
        label="Thêm bước hướng dẫn"
        onClick={handleAdd}
        disabled={disabled}
      />
    </>
  );
};

export default DirectionEditor;
