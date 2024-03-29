import TastealBreadCrumbs from '@/components/common/breadcrumbs/TastealBreadcrumbs';
import BoxImage from '@/components/common/image/BoxImage';
import WithFallback from '@/components/common/layouts/WithFallback';
import TastealTextField from '@/components/common/textFields/TastealTextField';
import BigSectionHeading from '@/components/common/typos/BigSectionHeading/BigSectionHeading';
import SectionHeading from '@/components/common/typos/SectionHeading';
import RecipeTimeInfo from '@/components/ui/cards/RecipeTimeInfo';
import DirectionItem from '@/components/ui/collections/DirectionItem';
import IngredientDisplayer from '@/components/ui/collections/IngredientDisplayer';
import SimpleContainer from '@/components/ui/container/SimpleContainer';
import NutrionPerServingInfo from '@/components/ui/displayers/NutrionPerServingInfo';
import SameAuthorRecipesCarousel from '@/components/ui/displayers/SameAuthorRecipesCarousel/SameAuthorRecipesCarousel';
import NutrionPerServingModal from '@/components/ui/modals/NutrionPerServingModal';
import Layout from '@/layout/Layout';
import { N_AValue, PageRoute } from '@/lib/constants/common';
import AppContext from '@/lib/contexts/AppContext';
import useFirebaseImage from '@/lib/hooks/useFirebaseImage';
import useSnackbarService from '@/lib/hooks/useSnackbar';
import { RecipeRes } from '@/lib/models/dtos/Response/RecipeRes/RecipeRes';
import { AccountEntity } from '@/lib/models/entities/AccountEntity/AccountEntity';
import { CommentEntity } from '@/lib/models/entities/CommentEntity/CommentEntity';
import { Nutrition_InfoEntity } from '@/lib/models/entities/Nutrition_InfoEntity/Nutrition_InfoEntity';
import AccountService from '@/lib/services/accountService';
import CommentService from '@/lib/services/commentService';
import RatingService, {
  Rating as RatingModel,
  RatingRes,
} from '@/lib/services/ratingService';
import RecipeService from '@/lib/services/recipeService';
import { createDebugStringFormatter } from '@/utils/debug/formatter';
import { Close, Edit, StarRateRounded } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  Modal,
  Rating,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { badWords } from 'vn-badwords';

const DEFAULT_NUTRITION_VALUE: Nutrition_InfoEntity = {
  id: 0,
  calories: 0,
  fat: 0,
  saturated_fat: 0,
  trans_fat: 0,
  cholesterol: 0,
  carbohydrates: 0,
  fiber: 0,
  sugars: 0,
  protein: 0,
  sodium: 0,
  vitaminD: 0,
  calcium: 0,
  iron: 0,
  potassium: 0,
};

// Mock bread crumbs data (will be remove later)
const breadCrumbsLinks = [
  {
    href: PageRoute.Home,
    label: 'Tasteal',
  },
  {
    href: PageRoute.Search,
    label: 'Công thức',
  },
  {
    label: 'Chi tiết',
  },
];

/**
 * Page id for debug purpose.
 * @constant {string} PAGE_ID
 */
const PAGE_ID = 'RecipeDetail';

/**
 * Constants for recipe detail page
 */
const RecipeDetailStringConstants = {
  DEFAULT_NAME: N_AValue,
  DEFAULT_INSTRUCTION: N_AValue,
} as const;

/**
 * Formatter help attach page identifier to message log.
 */
const debugStringFormatter = createDebugStringFormatter(PAGE_ID);

const RecipeDetail: FC = () => {
  //#region Loading

  const [loading, setLoading] = useState(false);

  //#endregion
  //#region Destructuring

  const { id } = useParams();

  //#endregion
  //#region Hooks

  const { handleSpinner, login } = useContext(AppContext);
  const navigate = useNavigate();
  const [snackbarAlert] = useSnackbarService();
  const {
    login: { user },
  } = useContext(AppContext);

  //#endregion
  //#region Recipe

  const [isRecipeFound, setIsRecipeFound] = useState(true);
  const [recipe, setRecipe] = useState<RecipeRes | null>(null);

  useEffect(() => {
    setRecipe(null);
    setLoading(true);
    handleSpinner(true);

    if (!id) {
      setRecipe(null);
      setLoading(false);
      console.log(debugStringFormatter('Failed to get recipe id'));
      return;
    }

    const parsedId = parseInt(id);

    RecipeService.GetById(parsedId)
      .then((recipe) => {
        setRecipe(recipe);
        setIsRecipeFound(true);
      })
      .catch((err) => {
        setRecipe(null);
        setIsRecipeFound(false);
        console.log(debugStringFormatter('Failed to get recipe data!'));
        console.log('error', err);
      })
      .finally(() => {
        handleSpinner(false);
        setLoading(false);
      });
  }, [handleSpinner, id]);

  //#endregion
  //#region Nutrition

  const [nutritionPerServingModalOpen, setNutritionPerServingModalOpen] =
    useState(false);

  const handleNutrionPerServingModalClose = useCallback(() => {
    setNutritionPerServingModalOpen(false);
  }, [setNutritionPerServingModalOpen]);

  //#endregion
  //#region Edit Recipe

  const canEditRecipe = useMemo(() => {
    if (login.user) {
      if (!login.user) return false;

      if (!recipe || !recipe.author) return false;

      return login.user.uid === recipe.author.uid;
    }

    return false;
  }, [login.user, recipe]);

  const handleOpenEditEditor = useCallback(() => {
    if (!id) {
      snackbarAlert('Lỗi khi truy vấn công thức', 'warning');
      return;
    }

    const intId = parseInt(id);

    navigate(PageRoute.Recipe.Edit(intId));
  }, [id, navigate, snackbarAlert]);

  //#endregion
  //#region Direction

  const [viewDirectionImageUrl, setViewDirectionImageUrl] = useState('');
  const [viewDirectionImageOpen, setViewDirectionImageOpen] = useState(false);

  const handleOpenViewDirectionImage = useCallback((url: string) => {
    setViewDirectionImageOpen(true);
    setViewDirectionImageUrl(url);
  }, []);

  const handleCloseViewDirectionImage = useCallback(() => {
    setViewDirectionImageOpen(false);
    setViewDirectionImageUrl('');
  }, []);

  //#endregion
  //#region Comment

  const [comment, setComment] = useState('');

  function handleComment() {
    const [valid, message] = validateComment();
    if (!valid) {
      snackbarAlert(message, 'warning');
      return;
    }

    console.log(recipe!.id, user.uid, comment);

    CommentService.Create(
      recipe!.id,
      user.uid,
      badWords(comment, '*') as string
    )
      .then(() => {
        GetComments(recipe!.id);
        setComment('');
      })
      .catch((error) => console.log('error', error));
  }
  function validateComment(): [boolean, string] {
    if (!comment) {
      return [false, 'Vui lòng nhập comment'];
    }
    if (!user) {
      return [false, 'Vui lòng đăng nhập!'];
    }
    if (!recipe) {
      return [false, 'Không lấy được thông tin công thức!'];
    }

    return [true, ''];
  }

  const [comments, setComments] = useState<CommentEntity[]>([]);
  useEffect(() => {
    if (!recipe) {
      return;
    }
    GetComments(recipe!.id);
  }, [recipe]);
  async function GetComments(id: number) {
    CommentService.Get(id)
      .then((res) => setComments(res.comments))
      .catch(() => setComments([]));
  }

  //#endregion
  //#region Rating

  const [rating, setRating] = useState(0);
  const [ratingData, setRatingData] = useState<RatingRes | null>(null);
  useEffect(() => {
    if (!recipe) return;
    RatingService.Get(recipe.id).then((res) => {
      setRatingData(res);
      const userRating = res?.comments.find((r) => r.account_id === user?.uid);
      if (userRating) {
        setRating(userRating.rating);
      }
      if (res) {
        setRatingData(res);
      }
    });
  }, [recipe, user?.uid]);
  async function handleRatingClicked(rating: number) {
    // Check if user rated before
    setRating(rating);

    let oldRating: RatingModel;

    try {
      const ratingRes = await RatingService.Get(recipe.id);
      if (ratingRes) {
        oldRating = ratingRes.comments.find((r) => r.account_id === user.uid);
      }
    } catch (err) {
      console.log(err);
    }

    if (oldRating) {
      await RatingService.Update(recipe.id, oldRating.id, rating);
    } else {
      await RatingService.Create(recipe.id, user.uid, rating);
    }
  }

  //#endregion
  //#region Others

  const recipeBrief = useMemo(() => {
    if (!recipe) {
      return RecipeDetailStringConstants.DEFAULT_NAME;
    }

    const ingredientCount = recipe.ingredients.length;
    const directionCount = recipe.directions.length;
    const totalTime = recipe.totalTime;

    return `${ingredientCount} NGUYÊN LIỆU • ${directionCount} BƯỚC • ${totalTime} PHÚT`;
  }, [recipe]);

  //#endregion

  // Ẩn hình
  const [hideImage, setHideImage] = useState(false);

  return (
    <Layout>
      <WithFallback criteria={isRecipeFound} fallback={<RecipeNotFound />}>
        <Container>
          <Grid
            container
            sx={{ backgroundColor: 'background.default', py: 2 }}
            spacing={2}
          >
            <Grid item xs={12}>
              <TastealBreadCrumbs links={breadCrumbsLinks} />
            </Grid>

            <Grid item xs={12}>
              <Grid container columnSpacing={4}>
                <Grid item xs={12} md={8}>
                  <BoxImage
                    src={recipe?.image ?? ''}
                    alt={'Không tìm thấy ảnh'}
                    quality={1}
                    sx={{
                      width: '100%',
                      height: 520,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Stack justifyContent={'center'} height={'100%'} gap={1}>
                    <Chip
                      label="Công thức"
                      sx={{
                        borderRadius: 1,
                        width: 'fit-content',
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        typography: 'body2',
                        fontWeight: 'bold',
                      }}
                    />
                    {loading ? (
                      <>
                        <Skeleton variant="rounded" animation="wave" />
                        <Skeleton
                          variant="rounded"
                          animation="wave"
                          height={80}
                        />
                        <Skeleton
                          variant="rounded"
                          animation="wave"
                          height={40}
                        />
                      </>
                    ) : (
                      <>
                        <Typography
                          fontStyle={'italic'}
                          color={'primary.main'}
                          sx={{
                            bgColor: 'secondary.main',
                            borderRadius: 4,
                            mt: 1,
                          }}
                        >
                          {recipeBrief}
                        </Typography>
                        <Typography
                          typography={'h3'}
                          color={'primary.main'}
                          fontWeight={'bold'}
                        >
                          {recipe?.name ??
                            RecipeDetailStringConstants.DEFAULT_NAME}
                        </Typography>
                        <Button
                          startIcon={<Edit />}
                          variant="contained"
                          onClick={() => handleOpenEditEditor()}
                          sx={{
                            display: canEditRecipe ? 'flex' : 'none',
                          }}
                        >
                          Chỉnh sửa
                        </Button>
                      </>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={8}>
              <Stack gap={8}>
                {loading ? (
                  <>
                    <Stack>
                      <SectionHeading>Mô tả</SectionHeading>
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        height={160}
                      />
                    </Stack>

                    <SimpleContainer>
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        height={120}
                      />
                    </SimpleContainer>
                    <Stack>
                      <SectionHeading>Nguyên liệu</SectionHeading>
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        height={400}
                      />
                    </Stack>
                    <Stack>
                      <SectionHeading>Ghi chú của tác giả</SectionHeading>
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        height={120}
                      />
                    </Stack>
                    <Stack>
                      <SectionHeading>
                        Hàm lượng dinh dưỡng trên khẩu phần ăn
                      </SectionHeading>
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        height={120}
                      />
                    </Stack>
                  </>
                ) : (
                  <>
                    <Stack>
                      <SectionHeading>Mô tả</SectionHeading>
                      <Typography color="primary.main" typography={'body1'}>
                        {recipe?.introduction ??
                          RecipeDetailStringConstants.DEFAULT_INSTRUCTION}
                      </Typography>
                    </Stack>

                    <RecipeTimeInfo totalTime={recipe?.totalTime} />

                    <IngredientDisplayer
                      ingredients={recipe?.ingredients ?? []}
                    />
                    <Stack>
                      <SectionHeading>Ghi chú của tác giả</SectionHeading>
                      <Typography color="primary.main" typography={'body1'}>
                        {recipe?.author_note ?? 'Không'}
                      </Typography>
                    </Stack>

                    <NutrionPerServingInfo
                      onClick={() => setNutritionPerServingModalOpen(true)}
                      nutritionInfo={
                        recipe?.nutrition_info ?? DEFAULT_NUTRITION_VALUE
                      }
                    />
                  </>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              {/* <SimpleContainer>
                {loading ? (
                  <Skeleton variant="rounded" animation="wave" height={60} />
                ) : (
                  <Box display="flex" flexDirection={'column'} gap={1}>
                    <Box display="flex" gap={1}>
                      <Typography variant="h6" fontWeight={'bold'}>
                        Hành động
                      </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Bookmark />}>
                      LƯU CÔNG THỨC
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      sx={{
                        color: 'primary.main',
                        backgroundColor: 'background.default',
                        '&:hover': {
                          backgroundColor: 'background.default',
                        },
                      }}
                    >
                      Thêm vào lịch ăn
                    </Button>
                  </Box>
                )}
              </SimpleContainer> */}

              <SimpleContainer sx={{ mt: 2 }}>
                {loading ? (
                  <Skeleton variant="rounded" animation="wave" height={60} />
                ) : (
                  <Box display={'flex'} flexDirection={'column'} gap={1}>
                    <Stack direction="row" alignItems={'center'} gap={2}>
                      <CustomAvatar path={recipe?.author.avatar} />
                      <Link
                        component={RouterLink}
                        to={PageRoute.Partner(recipe?.author.uid)}
                      >
                        <Typography fontWeight={'bold'}>
                          {recipe?.author.name}
                        </Typography>
                      </Link>
                    </Stack>
                    <Typography color="gray">
                      {recipe?.author.introduction}
                    </Typography>
                    <Link
                      color="primary.main"
                      fontWeight={'bold'}
                      component={RouterLink}
                      to={`/partner/${recipe?.author.uid}`}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {recipe?.author.link}
                    </Link>
                  </Box>
                )}
              </SimpleContainer>
            </Grid>
          </Grid>
        </Container>

        <Box
          sx={{
            backgroundColor: 'secondary.main',
          }}
        >
          <Container sx={{ py: 8, width: '100%' }}>
            <Stack width={{ xs: '100%', md: '60%' }} gap={1}>
              <Stack
                direction="row"
                justifyContent={'space-between'}
                alignItems={'center'}
              >
                <SectionHeading>Hướng dẫn nấu</SectionHeading>
                {loading ? (
                  <Skeleton variant="rounded" animation="wave" height={20} />
                ) : (
                  <Link
                    onClick={() => {
                      setHideImage(!hideImage);
                    }}
                  >
                    {hideImage ? 'Hiện' : 'Ẩn'} hình ảnh
                  </Link>
                )}
              </Stack>

              <Stack gap={2}>
                {loading ? (
                  <Skeleton variant="rounded" animation="wave" height={160} />
                ) : (
                  <>
                    {recipe?.directions.map((direction, index) => (
                      <DirectionItem
                        key={index}
                        value={direction}
                        last={index === recipe.directions.length - 1}
                        onImageClick={() =>
                          handleOpenViewDirectionImage(direction.image)
                        }
                        hideImage={hideImage}
                      />
                    ))}
                  </>
                )}
              </Stack>
            </Stack>
          </Container>
        </Box>

        <Box>
          <Container
            sx={{
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Stack width={{ xs: '100%', md: '60%' }} gap={1}>
              <Grid container>
                <Grid item xs={12} sm={8}>
                  <BigSectionHeading>Đánh giá & Review</BigSectionHeading>
                </Grid>
                {loading ? (
                  <Skeleton variant="rounded" animation="wave" />
                ) : (
                  <Stack direction="row" alignItems={'center'}>
                    <Typography
                      color="primary"
                      fontSize={20}
                      fontWeight={'bold'}
                    >
                      Đánh giá:
                    </Typography>
                    <Rating
                      size="large"
                      icon={<StarRateRounded />}
                      emptyIcon={<StarRateRounded />}
                      value={rating}
                      precision={0.5}
                      onChange={(_, value) => handleRatingClicked(value)}
                    />
                  </Stack>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack direction="row" gap={1}>
                  <Typography>{ratingData?.rating ?? 0}</Typography>
                  <Rating
                    size="large"
                    value={ratingData?.rating ?? 0}
                    icon={<StarRateRounded />}
                    emptyIcon={<StarRateRounded />}
                    readOnly
                  />
                  <Typography>
                    {ratingData?.comments.length ?? 0} đánh giá
                  </Typography>
                </Stack>
              </Grid>

              {loading ? (
                <Skeleton variant="rounded" animation="wave" height={160} />
              ) : (
                <>
                  <Box position="relative">
                    <TastealTextField
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      multiline
                      rows={4}
                      placeholder="Để lại bình luận"
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleComment}
                      sx={{
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                        opacity: comment ? 1 : 0,
                        transition: 'all 0.3s',
                      }}
                    >
                      Bình luận
                    </Button>
                  </Box>
                  <List>
                    {/* {recipe?.comments?.length > 0 &&
                        recipe?.comments.map((comment) => (
                          <CommentItem comment={comment} />
                        ))} */}
                    {comments.length > 0 &&
                      comments.map((comment, index) => (
                        <>
                          <CommentItem comment={comment} />

                          {index < comments.length - 1 && (
                            <Divider sx={{ my: 2, opacity: 0.4 }} />
                          )}
                        </>
                      ))}
                  </List>

                  {/* <Button
                    variant="contained"
                    size="large"
                    sx={{ alignSelf: 'center', mb: 2 }}
                    onClick={() => alert('Load more comments')}
                  >
                    Hiện thêm
                  </Button> */}
                </>
              )}
            </Stack>

            <Box
              component="img"
              src="https://www.sidechef.com/profile/0d2c1ebb-7521-4107-9b04-0c85d6a5b4f1.png"
              borderRadius={6}
            ></Box>

            <Box
              sx={{
                display: recipe?.relatedRecipes.length > 1 ? 'block' : 'none',
              }}
            >
              <Box
                display="flex"
                justifyContent={'space-between'}
                alignItems={'center'}
              >
                <BigSectionHeading>
                  Xem thêm của {recipe?.author.name || '{AuthorName}'} tại
                  SideChef
                </BigSectionHeading>
                <Button
                  sx={{
                    color: 'primary.main',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={() =>
                    navigate(PageRoute.Partner(recipe?.author.uid))
                  }
                >
                  Xem tất cả
                </Button>
              </Box>
              <Box>
                {loading ? (
                  <Skeleton variant="rounded" animation="wave" height={320} />
                ) : (
                  <SameAuthorRecipesCarousel
                    recipes={recipe?.relatedRecipes.filter(
                      (item) => item.id !== recipe.id
                    )}
                  />
                )}
              </Box>
            </Box>
          </Container>
        </Box>

        <NutrionPerServingModal
          open={nutritionPerServingModalOpen}
          onClose={handleNutrionPerServingModalClose}
          nutritionInfo={recipe?.nutrition_info}
        />

        <Modal
          open={viewDirectionImageOpen}
          onClose={handleCloseViewDirectionImage}
          aria-labelledby="modal-view-direction-image"
          aria-describedby="modal-view-direction-image"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              boxShadow: 24,
              borderRadius: '24px',
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: 'primary.contrastText',
              maxHeight: '90%',
              overflowY: 'auto',
              '::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <BoxImage
              quality={100}
              src={viewDirectionImageUrl}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            <IconButton
              sx={{
                color: 'primary.contrastText',
                position: 'absolute',
                top: 8,
                right: 8,
                transition: 'all 0.2s ease-in-out',
                ':hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Close onClick={handleCloseViewDirectionImage} />
            </IconButton>
          </Box>
        </Modal>
      </WithFallback>
    </Layout>
  );
};

function CustomAvatar({ path }: { path: string }) {
  const avatar = useFirebaseImage(path);

  return (
    <Avatar>
      <BoxImage
        src={avatar}
        sx={{
          width: '100%',
          height: '100%',
        }}
      />
    </Avatar>
  );
}

function RecipeNotFound() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <Typography typography="h4" align="center">
        Xin lỗi, công thức không tồn tại!
      </Typography>
    </Box>
  );
}

function CommentItem({ comment }: { comment: CommentEntity }) {
  const [account, setAccount] = useState<AccountEntity | null>(null);
  useEffect(() => {
    AccountService.GetByUid(comment.account_id)
      .then((account) => setAccount(account))
      .catch(() => setAccount(null));
  }, [comment.account_id]);

  return (
    <ListItem
      disablePadding
      sx={{
        pb: 2,
      }}
    >
      <Stack direction="row" width="100%">
        <Box pr={3}>
          <BoxImage
            src={account?.avatar ?? ''}
            alt={
              account
                ? 'Comment avatar of ' + account.name
                : 'null comment avatar'
            }
            quality={1}
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
            }}
          />
        </Box>
        <Stack
          gap={2}
          sx={{
            flexGrow: 1,
          }}
        >
          <Stack gap={1}>
            <Typography typography="h6">
              {account?.name ?? 'Không tìm thấy'}
            </Typography>
            <Typography typography="body1">
              {comment.created_at
                ? new Date(comment.created_at).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Trống'}
            </Typography>
          </Stack>
          {/* <Rating readOnly /> */}
          <Typography fontSize={20}>{comment.comment}</Typography>
        </Stack>
      </Stack>
    </ListItem>
  );
}

export default RecipeDetail;
