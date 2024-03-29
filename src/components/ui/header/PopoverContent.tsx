import { popoverPath } from '@/assets/exportImage';
import { Box, Container, Grid, Link, Typography } from '@mui/material';
import { useContext } from 'react';
import { TuKhoa } from '../../../pages/Search';

import { CustomLink, CustomLinkSkeleton } from './CustomLink';
import { OccasionEntity } from '@/lib/models/entities/OccasionEntity/OccasionEntity';
import BoxImage from '@/components/common/image/BoxImage';

import AppContext from '@/lib/contexts/AppContext';
import { PageRoute } from '@/lib/constants/common';
import { Ingredient_TypeEntity } from '@/lib/models/entities/Ingredient_TypeEntity/Ingredient_TypeEntity';

const gridItemSX = {
  height: '100%',
  borderRight: 1.5,
  borderColor: 'secondary.main',
  pt: 1,
};

const limit = 5;

export type PopoverContentProps = {
  tuKhoas: TuKhoa[];
  ingredientTypes: Ingredient_TypeEntity[];
  occasions: OccasionEntity[];
};

export function PopoverContent() {
  const { popOverHeader } = useContext(AppContext);
  console.log(popOverHeader);

  return (
    <>
      <Container
        sx={{
          pt: 4,
          pb: 6,
          width: '100%',
        }}
      >
        <Grid
          container
          spacing={4}
          justifyContent={'flex-start'}
          alignItems={'flex-start'}
          alignSelf={'stretch'}
        >
          <Grid item xs={3}>
            <BoxImage
              src={popoverPath}
              quality={10}
              sx={{
                width: '100%',
                aspectRatio: '1/1',
                border: 1,
                borderColor: 'secondary.main',
                borderRadius: 2,
              }}
            />
          </Grid>

          <Grid item xs={3}>
            <Box sx={gridItemSX}>
              <Typography variant="h6" fontWeight={'bold'}>
                Hot Trend
              </Typography>

              {!popOverHeader && (
                <>
                  {new Array(limit).fill(0).map((_item, index) => {
                    return <CustomLinkSkeleton key={index} />;
                  })}
                </>
              )}

              {popOverHeader?.tuKhoas.slice(0, limit + 1).map((item) => {
                return (
                  <CustomLink
                    key={item.keyword}
                    href={PageRoute.Search}
                    label={item.keyword}
                  />
                );
              })}
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box sx={gridItemSX}>
              <Typography variant="h6" fontWeight={'bold'}>
                Loại nguyên liệu
              </Typography>

              {!popOverHeader && (
                <>
                  {new Array(limit).fill(0).map((_item, index) => {
                    return <CustomLinkSkeleton key={index} />;
                  })}
                </>
              )}

              {popOverHeader?.ingredientTypes.slice(0, limit).map((item) => {
                return (
                  <CustomLink
                    key={item.id}
                    href={PageRoute.ReferenceIngredient(`${item.id}`)}
                    label={item.name}
                  />
                );
              })}
              {popOverHeader?.ingredientTypes.length > 0 && (
                <CustomLink
                  href={PageRoute.Reference('ingredients')}
                  label={'XEM TẤT CẢ'}
                  fontStyle="italic"
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box sx={{ ...gridItemSX, borderRight: 0 }}>
              <Typography variant="h6" fontWeight={'bold'}>
                Dịp
              </Typography>

              {!popOverHeader && (
                <>
                  {new Array(limit).fill(0).map((_item, index) => {
                    return <CustomLinkSkeleton key={index} />;
                  })}
                </>
              )}

              {popOverHeader?.occasions.slice(0, limit).map((item) => {
                return (
                  <CustomLink
                    key={item.id}
                    href={PageRoute.Reference('occasions')}
                    label={item.name}
                  />
                );
              })}

              {popOverHeader?.occasions.length > 0 && (
                <CustomLink
                  href={PageRoute.Reference('occasions')}
                  label={'XEM TẤT CẢ'}
                  fontStyle="italic"
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                pt: 2,
              }}
            >
              <Link
                href={PageRoute.Search}
                typography={'body1'}
                sx={{
                  textAlign: 'center',
                }}
              >
                XEM TẤT CẢ CÔNG THỨC
              </Link>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
