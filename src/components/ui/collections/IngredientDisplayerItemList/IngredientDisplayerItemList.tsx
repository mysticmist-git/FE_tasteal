import { Divider, Stack } from "@mui/material";
import { FC } from "react";
import IngredientDisplayerItem from "./IngredientDisplayerDataItem/IngredientDisplayerItem";
import IngredientDisplayerItemListProps from "./types/IngredientDisplayerItemListProps";

const IngredientDisplayerItemList: FC<IngredientDisplayerItemListProps> = ({
  ingredients,
  servingSize,
}) => {
  return (
    <Stack
      divider={<Divider sx={{ borderColor: "primary.main", opacity: 0.4 }} />}
      gap={2}
    >
      {ingredients.map((ingredient) => (
        <IngredientDisplayerItem
          key={ingredient.id}
          value={ingredient}
          servingSize={servingSize}
        />
      ))}
    </Stack>
  );
};

export default IngredientDisplayerItemList;