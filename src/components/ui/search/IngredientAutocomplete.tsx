import BoxImage from '@/components/common/image/BoxImage';
import { RecipeSearchReq } from '@/lib/models/dtos/Request/RecipeSearchReq/RecipeSearchReq';
import { IngredientEntity } from '@/lib/models/entities/IngredientEntity/IngredientEntity';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Checkbox,
  CircularProgress,
  Paper,
  TextField,
} from '@mui/material';
import React from 'react';

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

// function sleep(duration: number): Promise<void> {
//     return new Promise<void>((resolve) => {
//         setTimeout(() => {
//             resolve();
//         }, duration);
//     });
// }
export function IngredientAutocomplete({
  ingredients,
  ingredientIds,
  handleChange,
}: {
  ingredients: IngredientEntity[];
  ingredientIds: RecipeSearchReq['IngredientID'];
  handleChange: (ingredients: IngredientEntity[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<IngredientEntity[]>([]);
  const loading = open && options.length === 0;

  React.useEffect(() => {
    if (!loading) {
      return undefined;
    }
    setOptions([...ingredients]);
  }, [loading]);

  React.useEffect(() => {
    setOptions([...ingredients]);
  }, [ingredients]);

  return (
    <>
      <Autocomplete
        sx={{
          backgroundColor: 'white',
          width: '100%',
        }}
        multiple
        limitTags={1}
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        loading={loading}
        options={options}
        value={
          ingredientIds
            ? options.filter((item) => ingredientIds.includes(item.id))
            : []
        }
        onChange={(_, value) => {
          handleChange(value);
        }}
        getOptionLabel={(option) => option.name}
        PaperComponent={(props) => (
          <Paper
            {...props}
            sx={{
              width: { sm: '100%', md: '100%', lg: '30vw' },
            }}
            elevation={1}
          />
        )}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 2 }}
              checked={selected}
            />

            <BoxImage
              src={option.image}
              alt={option.name}
              quality={1}
              sx={{
                width: '32px',
                borderRadius: 2,
                mr: 1,
              }}
            />
            {option.name}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Nguyên liệu"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
              sx: {
                borderRadius: 2,
                border: 0,
              },
            }}
          />
        )}
      />
    </>
  );
}
