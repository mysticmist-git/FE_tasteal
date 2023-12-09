import React, { useContext, useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Typography,
    Box,
    BoxProps,
    Button,
} from '@mui/material';
import Layout from '../layout/Layout';
import { WeekNavigation } from '@/components/ui/mealPlan/WeekNavigation.tsx';
import WeekDateItem from '@/components/ui/mealPlan/WeekDateItem.tsx';
import AccountService from '@/lib/services/accountService';
import PlanItemService from '@/lib/services/planItemService';

import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Plan_ItemEntity } from '@/lib/models/entities/Plan_ItemEntity/Plan_ItemEntity';
import AppContext from '@/lib/contexts/AppContext';
import { ActionSection } from '../components/ui/mealPlan/ActionSection';

export type DateDisplay = {
    label: string;
    date?: string;
    planItems?: Plan_ItemEntity[];
};

const initialWeekDates: DateDisplay[] = [
    {
        label: 'Thứ hai',
    },
    {
        label: 'Thứ ba',
    },
    {
        label: 'Thứ tư',
    },
    {
        label: 'Thứ năm',
    },
    {
        label: 'Thứ sáu',
    },
    {
        label: 'Thứ bảy',
    },
    {
        label: 'Chủ nhật',
    },
];

export const getStart_EndOfWeek = (
    offset: number
): { start: Date; end: Date } => {
    const currentDate = new Date();
    const currentDay = currentDate.getUTCDay();

    const startOfWeek = new Date(currentDate);
    startOfWeek.setUTCDate(
        currentDate.getUTCDate() - currentDay + (currentDay === 0 ? -6 : 1)
    );

    startOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7 * offset);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);

    return { start: startOfWeek, end: endOfWeek };
};

function getWeekDates(offset: number): string[] {
    const { start: startOfWeek, end: endOfWeek } = getStart_EndOfWeek(offset);

    const dates: string[] = [];

    for (
        let day = new Date(startOfWeek);
        day <= endOfWeek;
        day.setUTCDate(day.getUTCDate() + 1)
    ) {
        const dateString = new Date(day.getTime()).toISOString().slice(0, 10);
        dates.push(dateString);
    }

    return dates;
}

const MealPlanner: React.FC = () => {
    const { handleSpinner, login } = useContext(AppContext);

    //#region Week đếm số
    const [weekCounter, setWeekCounter] = React.useState(0);
    function handleChangeWeekCounter(increment: number) {
        setWeekCounter((prev) => prev + increment);
    }
    //#endregion

    // #region Dữ liệu chính

    const [weekDates, setWeekDates] = React.useState<DateDisplay[]>([]);

    const [planItemData, setPlanItemData] = React.useState<Plan_ItemEntity[]>(
        []
    );

    //#endregion

    //#region UseEffect

    useEffect(() => {
        async function fetchData(uid: string) {
            const account = await AccountService.GetByUid(uid);

            const planItems = await PlanItemService.GetPlanItemsByAccountId(
                account?.uid
            );

            if (!planItems) {
                return;
            }

            setPlanItemData(planItems);
            setWeekCounter(0);
            const dates = getWeekDates(0);
            const data: DateDisplay[] = [];

            for (let i = 0; i < initialWeekDates.length; i++) {
                const date = dates[i];
                if (date) {
                    data.push({
                        ...initialWeekDates[i],
                        date,
                        planItems: planItems
                            .filter((item) => {
                                const itemDate = new Date(item.plan?.date);
                                return (
                                    itemDate.toISOString().split('T')[0] ===
                                    date
                                );
                            })
                            .sort((a, b) => {
                                return a.order - b.order;
                            }),
                    });
                }
            }

            setWeekDates(data);
        }

        handleSpinner(true);
        if (login.isUserSignedIn == true && login.user != undefined) {
            fetchData(login.user.uid);
        }
        handleSpinner(false);
    }, []);

    useEffect(() => {
        const dates = getWeekDates(weekCounter);
        const data: DateDisplay[] = [];

        for (let i = 0; i < initialWeekDates.length; i++) {
            const date = dates[i];
            if (date) {
                data.push({
                    ...initialWeekDates[i],
                    date,
                    planItems: planItemData
                        .filter((item) => {
                            const itemDate = new Date(item.plan?.date);
                            return (
                                itemDate.toISOString().split('T')[0] === date
                            );
                        })
                        .sort((a, b) => {
                            return a.order - b.order;
                        }),
                });
            }
        }

        setWeekDates(data);
    }, [weekCounter]);

    useEffect(() => {
        setWeekDates((prev) => {
            return prev.map((date) => {
                return {
                    ...date,
                    planItems: planItemData
                        .filter((item) => {
                            const itemDate = new Date(item.plan?.date);
                            return (
                                itemDate.toISOString().split('T')[0] ===
                                date.date
                            );
                        })
                        .sort((a, b) => {
                            return a.order - b.order;
                        }),
                };
            });
        });
    }, [planItemData]);

    //#endregion

    //#region Drag and Drop
    const [isDragging, setIsDragging] = useState(false);

    const onDragStart = (dragStart: DropResult) => {
        setIsDragging(true);
        console.log(dragStart);
    };
    const onDragEnd = (dropResult: DropResult) => {
        setIsDragging(false);

        if (
            !dropResult.destination ||
            !dropResult.source ||
            !dropResult.draggableId
        )
            return;
        if (
            dropResult.destination.index === dropResult.source.index &&
            dropResult.destination.droppableId === dropResult.source.droppableId
        ) {
            return;
        }

        let oldDate = new Date(dropResult.source.droppableId);
        let newDate = new Date(dropResult.destination.droppableId);

        const planItemMove = {
            id: parseInt(dropResult.draggableId),
            from: oldDate,
            to: newDate,
            fromIndex: dropResult.source.index,
            toIndex: dropResult.destination.index,
        };

        const planItem = planItemData.find(
            (item) => item.id === planItemMove.id
        );

        let finalPlanItemData = [
            ...planItemData.filter(
                (item) =>
                    item.plan?.date.getTime() !== oldDate.getTime() &&
                    item.plan?.date.getTime() !== newDate.getTime()
            ),
        ];

        if (planItemMove.from.getTime() !== planItemMove.to.getTime()) {
            let sourceArray = planItemData
                .filter(
                    (item) =>
                        item.plan?.date.getTime() ===
                        planItemMove.from.getTime()
                )
                .sort((a, b) => {
                    return a.order - b.order;
                });
            sourceArray.splice(planItemMove.fromIndex, 1);
            sourceArray = sourceArray.map((item, index) => {
                return {
                    ...item,
                    order: index + 1,
                };
            });

            let destinationArray = planItemData
                .filter(
                    (item) =>
                        item.plan?.date.getTime() === planItemMove.to.getTime()
                )
                .sort((a, b) => {
                    return a.order - b.order;
                });

            const existRecipe = destinationArray
                .map((item) => item.recipe.id)
                .findIndex((id) => id === planItem.recipe.id);

            if (existRecipe !== -1) {
                if (confirm('Công thức trùng lặp! Bạn vẫn muốn thêm?')) {
                } else {
                    return;
                }
            }

            destinationArray.splice(planItemMove.toIndex, 0, {
                ...planItem,
                plan: {
                    ...planItem.plan,
                    date: planItemMove.to,
                },
            });
            destinationArray = destinationArray.map((item, index) => {
                return {
                    ...item,
                    order: index + 1,
                };
            });

            finalPlanItemData = [
                ...finalPlanItemData,
                ...sourceArray,
                ...destinationArray,
            ];
        } else {
            let sourceArray = planItemData
                .filter(
                    (item) =>
                        item.plan?.date.getTime() ===
                        planItemMove.from.getTime()
                )
                .sort((a, b) => {
                    return a.order - b.order;
                });

            sourceArray.splice(planItemMove.fromIndex, 1);
            sourceArray.splice(planItemMove.toIndex, 0, {
                ...planItem,
                plan: {
                    ...planItem.plan,
                    date: planItemMove.to,
                },
            });

            sourceArray = sourceArray.map((item, index) => {
                return {
                    ...item,
                    order: index + 1,
                };
            });
            finalPlanItemData = [...finalPlanItemData, ...sourceArray];
        }

        setPlanItemData(finalPlanItemData);
    };

    //#endregion

    function handleRemovePlanItem(id: number) {
        const planItemDelete = planItemData.find((item) => item.id === id);

        const newPlanItemData = planItemData
            .filter((item) => item.id !== id)
            .map((item) => {
                if (
                    item.plan?.date.getTime() ===
                        planItemDelete?.plan?.date.getTime() &&
                    item.order >= planItemDelete?.order
                ) {
                    return {
                        ...item,
                        order: item.order - 1,
                    };
                }
                return {
                    ...item,
                };
            });

        setPlanItemData(newPlanItemData);
    }

    return (
        <Layout>
            {login.isUserSignedIn && (
                <>
                    <Grid
                        container
                        alignItems={'stretch'}
                        justifyContent={'center'}
                    >
                        <Grid
                            item
                            xs={12}
                        >
                            <Container
                                sx={{
                                    py: 3,
                                }}
                            >
                                <Grid
                                    sx={{ width: '100%' }}
                                    container
                                    justifyContent={'center'}
                                    alignItems={'center'}
                                    spacing={{
                                        xs: 3,
                                        md: 2,
                                    }}
                                >
                                    <Grid
                                        item
                                        xs={12}
                                        md={4}
                                    >
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Lịch ăn của tôi
                                        </Typography>
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={4}
                                        sx={{
                                            display: {
                                                xs: 'none',
                                                md: 'block',
                                            },
                                        }}
                                    >
                                        <WeekNavigation
                                            weekCounter={weekCounter}
                                            handleChangeWeekCounter={
                                                handleChangeWeekCounter
                                            }
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={4}
                                    >
                                        <ActionSection
                                            weekCounter={weekCounter}
                                            handleChangeWeekCounter={(
                                                value: number
                                            ) => {
                                                setWeekCounter(value);
                                            }}
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        sx={{
                                            display: {
                                                xs: 'block',
                                                md: 'none',
                                            },
                                        }}
                                    >
                                        <WeekNavigation
                                            weekCounter={weekCounter}
                                            handleChangeWeekCounter={
                                                handleChangeWeekCounter
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </Container>
                        </Grid>

                        <Grid
                            item
                            xs={12}
                        >
                            <Box
                                sx={{
                                    backgroundColor: 'secondary.main',
                                    py: 4,
                                }}
                            >
                                <Container>
                                    <DragDropContext
                                        onDragStart={onDragStart}
                                        onDragEnd={onDragEnd}
                                    >
                                        <Box
                                            sx={{
                                                width: '100%',
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                backgroundColor:
                                                    'background.default',
                                                border: 1,
                                                borderColor: 'grey.300',
                                            }}
                                        >
                                            <Grid
                                                container
                                                justifyContent={'flex-start'}
                                                alignItems={'stretch'}
                                            >
                                                {weekDates.map(
                                                    (item, index) => (
                                                        <Grid
                                                            item
                                                            xs={12}
                                                            sm={6}
                                                            md={4}
                                                            lg={3}
                                                            key={index}
                                                        >
                                                            <WeekDateItem
                                                                isDragging={
                                                                    isDragging
                                                                }
                                                                weekDates={item}
                                                                handleRemovePlanItem={
                                                                    handleRemovePlanItem
                                                                }
                                                            />
                                                        </Grid>
                                                    )
                                                )}
                                            </Grid>
                                        </Box>
                                    </DragDropContext>
                                </Container>
                            </Box>
                        </Grid>
                    </Grid>
                </>
            )}
            {login.isUserSignedIn == false && (
                <>
                    <h1>Lỗi đăng nhập</h1>
                </>
            )}
        </Layout>
    );
};

export default MealPlanner;
