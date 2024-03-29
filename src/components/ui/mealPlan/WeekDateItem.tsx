import { DateDisplay, compareTwoDates } from '@/pages/MealPlanner';
import { Box, Typography } from '@mui/material';

import { AddRecipeButton } from './AddRecipeButton';
import { HighlightAltRounded } from '@mui/icons-material';
import { Droppable } from 'react-beautiful-dnd';
import { RecipeEntity } from '@/lib/models/entities/RecipeEntity/RecipeEntity';
import { useMemo } from 'react';
import { MealPlanCard } from './MealPlanCard';
import { Plan_ItemEntity } from '@/lib/models/entities/Plan_ItemEntity/Plan_ItemEntity';

function WeekDateItem({
  isDragging,
  weekDates,
  handleRemovePlanItem,
  AddPlanItem,
}: {
  isDragging: boolean;
  weekDates: DateDisplay;
  handleRemovePlanItem: (
    date: Date,
    recipeId: number,
    order: number
  ) => Promise<void>;
  AddPlanItem: (item: Plan_ItemEntity) => Promise<void>;
}) {
  const isToday = useMemo(
    () => compareTwoDates(weekDates.date, new Date()),
    [weekDates.date]
  );

  return (
    <>
      <Box
        sx={{
          backgroundColor: isToday ? 'primary.light' : 'background.default',
          height: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 0.5,
            border: 1,
            borderColor: 'grey.300',
            gap: 2,
            background: isToday ? 'rgba(255, 255, 255, 0.95)' : '',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: isToday ? 'primary.main' : 'grey.600',
                  lineHeight: 1,
                }}
                variant="body1"
                fontWeight={'bold'}
              >
                {weekDates.label}
              </Typography>
              <Typography
                variant="caption"
                fontWeight={'medium'}
                sx={{
                  color: isToday ? 'primary.main' : 'grey.500',
                  lineHeight: 0.5,
                }}
              >
                {weekDates.date.toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </Typography>
            </Box>

            <AddRecipeButton weekDates={weekDates} AddPlanItem={AddPlanItem} />
          </Box>

          {/* <Box
            sx={{
              width: '100%',
              p: 2,
            }}
          >
            <NoteTextField />
          </Box> */}

          {weekDates.date && (
            <Droppable
              droppableId={weekDates.date.toString()}
              type="group"
              key={weekDates.date.toString()}
            >
              {(provided, _snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    borderRadius: 2,
                    p: 2,
                    gap: 4,
                    backgroundColor: isDragging ? 'grey.200' : '',
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      display:
                        weekDates.planItems.length === 0 ? 'flex' : 'none',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '200px',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <HighlightAltRounded
                      sx={{
                        color: 'grey.500',
                        fontSize: 80,
                      }}
                    />
                  </Box>
                  {weekDates.planItems.map(
                    (item, index) =>
                      item && (
                        <MealPlanCard
                          index={index}
                          planItem={item}
                          key={index}
                          recipe={item.recipe as RecipeEntity}
                          handleRemovePlanItem={handleRemovePlanItem}
                        />
                      )
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          )}
        </Box>
      </Box>
    </>
  );
}

export default WeekDateItem;
