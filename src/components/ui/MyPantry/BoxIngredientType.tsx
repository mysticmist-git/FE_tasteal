import { Box, Stack, Typography, useTheme } from '@mui/material';
import { DisplayPantryItem } from './PantryContent';
import { PantryCard } from './PantryCard';
import { Pantry_ItemEntity } from '@/lib/models/entities/Pantry_ItemEntity/Pantry_ItemEntity';

export function BoxIngredientType({
  displayPantryItem,
  handleOpenDialog,
  hanlePantryItemsChange,
}: {
  displayPantryItem: DisplayPantryItem;
  handleOpenDialog: (item: Pantry_ItemEntity) => void;
  hanlePantryItemsChange: (
    type: 'add' | 'remove' | 'update',
    item: Pantry_ItemEntity[]
  ) => Promise<void>;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        border: 1,
        borderColor: 'grey.500',
        overflow: 'hidden',
        display: displayPantryItem.ingredients.length > 0 ? 'block' : 'none',
      }}
    >
      {/* Title */}
      <Stack
        direction={'row'}
        alignItems={'center'}
        justifyContent={'center'}
        sx={{
          width: '100%',
          backgroundColor: 'grey.200',
          borderBottom: 1,
          borderColor: 'grey.500',
        }}
        spacing={1}
      >
        <Typography
          variant="body2"
          fontWeight={900}
          color={'primary'}
          sx={{
            textAlign: 'center',
            py: 1,
          }}
        >
          {displayPantryItem.ingredientType
            ? displayPantryItem.ingredientType.name
            : 'Khác'}
        </Typography>
        <Box
          sx={{
            width: theme.spacing(1),
            aspectRatio: '1/1',
            bgcolor: 'primary.main',
            borderRadius: '50%',
          }}
        />
        <Typography
          variant="body2"
          fontWeight={900}
          color={'primary'}
          sx={{
            textAlign: 'center',
            py: 1,
          }}
        >
          {displayPantryItem.ingredients.length}
        </Typography>
      </Stack>

      {/* Cards */}
      <Stack
        direction={'row'}
        sx={{ width: '100%', pt: 2, p: 1 }}
        flexWrap={'wrap'}
      >
        {displayPantryItem.ingredients.map((item) => {
          return (
            <Box
              key={item.id}
              sx={{
                width: {
                  xs: 'calc(100% / 3)',
                  sm: 'calc(100% / 5)',
                  md: 'calc(100% / 6)',
                  lg: 'calc(100% / 7)',
                },
                p: 1,
              }}
            >
              <PantryCard
                item={item}
                hanlePantryItemsChange={hanlePantryItemsChange}
                handleOpenDialog={handleOpenDialog}
              />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
