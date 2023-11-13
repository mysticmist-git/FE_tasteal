import { PrimaryCard } from "@/components/common/card/PrimaryCard";
import { CustomCarousel } from "@/components/common/carousel/CustomeCarousel";
import { responsive } from "@/lib/constants/responsiveCarousel";
import { RelatedRecipe } from "@/lib/models/dtos/reicpeDTO";
import { Typography } from "@mui/material";
import { FC } from "react";

type SameAuthorRecipesCarouselProps = {
  recipes: RelatedRecipe[];
};

const SameAuthorRecipesCarousel: FC<SameAuthorRecipesCarouselProps> = ({
  recipes,
}) => {
  return (
    <>
      {recipes && recipes.length > 0 ? (
        <>
          <CustomCarousel
            responsive={responsive}
            removeArrowOnDeviceType={["sm", "xs"]}
          >
            {recipes.map((recipe, index) => (
              <PrimaryCard key={index} recipe={recipe} />
            ))}
          </CustomCarousel>
        </>
      ) : (
        <>
          <Typography>There are no recipes from this author.</Typography>
        </>
      )}
    </>
  );
};

export default SameAuthorRecipesCarousel;
