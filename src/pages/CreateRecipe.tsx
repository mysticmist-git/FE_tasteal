import RoundedButton from '@/components/common/buttons/RoundedButton';
import ChipsDisplayer, {
  ChipValue,
} from '@/components/common/collections/ChipsDisplayer';
import ImagePicker from '@/components/common/files/ImagePicker';
import TastealTextField from '@/components/common/textFields/TastealTextField';
import FormLabel from '@/components/common/typos/FormLabel';
import FormTitle from '@/components/common/typos/FormTitle';
import DirectionEditor from '@/components/ui/collections/DirectionEditor';
import { DirectionEditorItemValue } from '@/components/ui/collections/DirectionEditor/DirectionEditorItem/DirectionEditorItem';
import IngredientSelector from '@/components/ui/collections/IngredientSelector';
import { IngredientItemData } from '@/components/ui/collections/IngredientSelector/types';
import NewIngredientModal from '@/components/ui/modals/NewIngredientModal';
import ServingSizeSelect from '@/components/ui/selects/ServingSizeSelect';
import Layout from '@/layout/Layout';
import { PageRoute } from '@/lib/constants/common';
import { ServingSizes } from '@/lib/constants/options';
import { StoragePath } from '@/lib/constants/storage';
import AppContext from '@/lib/contexts/AppContext';
import { deleteImage, uploadImage } from '@/lib/firebase/image';
import useSnackbarService from '@/lib/hooks/useSnackbar';
import { RecipeReq } from '@/lib/models/dtos/Request/RecipeReq/RecipeReq';
import { Recipe_IngredientReq } from '@/lib/models/dtos/Request/Recipe_IngredientReq/Recipe_IngredientReq';
import { RecipeRes } from '@/lib/models/dtos/Response/RecipeRes/RecipeRes';
import { Direction } from '@/lib/models/dtos/common';
import CookbookService from '@/lib/services/cookbookService';
import OccasionService from '@/lib/services/occasionService';
import RecipeService from '@/lib/services/recipeService';
import { CommonMessage } from '@/utils/constants/message';
import { createDebugStringFormatter } from '@/utils/debug/formatter';
import { getFileExtension } from '@/utils/file';
import { dateTimeToMinutes } from '@/utils/format';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
} from '@mui/material';
import { nanoid } from 'nanoid';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

//#region Local constants and functions

/**
 * Create debug string
 */
const createDebugString = createDebugStringFormatter('CreateRecipe');

/**
 * Represents a new recipe.
 */
type NewRecipe = {
  /** The name of the recipe. */
  name: string;
  /** The introduction for the recipe. */
  introduction: string;
  /** The image URL of the recipe. */
  image: string;
  /** The serving size of the recipe. */
  servingSize: number;
  /** The list of ingredients for the recipe. */
  ingredients: IngredientItemData[];
  /** The list of directions for the recipe. */
  directions: DirectionEditorItemValue[];
  /** Any additional notes from the author. */
  authorNote: string;
  /** The total time of the recipe.  */
  totalTime: number;
  /** The active time of the recipe. */
  activeTime: number;
  /** Indicates if the recipe is private. */
  isPrivate: boolean;

  occasions: number[];
};

const DEFAULT_NEW_RECIPE: NewRecipe = {
  name: '',
  image: '',
  servingSize: 1,
  ingredients: [],
  directions: [],
  introduction: '',
  totalTime: 0,
  activeTime: 0,
  authorNote: '',
  isPrivate: true,
  occasions: [],
};

const resolveDirectionImage = async (
  direction: DirectionEditorItemValue,
  imageId: string,
  step: number
): Promise<Omit<Direction, 'recipe_id'>> => {
  const { imageFile, ...others } = direction;

  if (imageFile) {
    try {
      const path = await uploadImage(
        imageFile,
        `${StoragePath.DIRECTION}/${imageId}[${step}].${getFileExtension(
          imageFile.name
        )}`
      );

      return {
        ...others,
        image: path,
      };
    } catch (e) {
      throw new Error('Failed to upload a blob or file!');
    }
  }

  return Promise.resolve({
    ...others,
    image: '',
  });
};

const resolveDirectionsImage = (
  directions: DirectionEditorItemValue[],
  imageId: string
): Promise<Omit<Direction, 'recipe_id'>[]> => {
  return Promise.all(
    directions.map((dir, index) =>
      resolveDirectionImage(dir, imageId, index + 1)
    )
  );
};

/**
 * Local message constants
 */
const LocalMessageConstant = {
  Validation: {
    InvalidData: 'Dữ liệu không hợp lệ!',
    NameRequired: 'Tên không được để trống!!',
    IntroductionRequired: 'Giới thiệu không được để trống!',
    IngredientRequired: 'Vui lòng thêm nguyên liệu!',
    DirectionRequired: 'Vui lòng thêm bước thực hiện!',
    TotalTimeRequired: 'Tổng thời gian không được để trống!',
    InvalidActiveTime: 'Thời gian thực phải nhỏ hơn tổng thời gian!',
    ImageRequired: 'Vui lòng tải ảnh đại diện!',
  } as const,
} as const;

//#endregion

const CreateRecipe: React.FunctionComponent<{ edit?: boolean }> = ({
  edit = false,
}) => {
  //#region Hooks

  const { id } = useParams();
  const [snackbarAlert] = useSnackbarService();
  const {
    login: { user },
  } = useContext(AppContext);
  const navigate = useNavigate();
  const { handleSpinner } = useContext(AppContext);

  //#endregion
  //#region General Recipe

  const [recipeThumbnailFile, setRecipeThumbnailFile] = useState<File | null>(
    null
  );
  const [newRecipe, setNewRecipe] = useState<NewRecipe>(DEFAULT_NEW_RECIPE);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNewRecipeFieldChange = useCallback(
    <T extends keyof NewRecipe>(field: T, value: NewRecipe[T]) => {
      setNewRecipe((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleRecipeThumbnailChange = useCallback((file: File | null) => {
    setRecipeThumbnailFile(file);
  }, []);

  //#endregion
  //#region Occasions

  const [occasions, setOccasions] = useState([]);
  const [selectedOccasions, setSelectedOccasions] = useState<ChipValue[]>([]);

  const filterOccasions = useCallback(
    (occasions: ChipValue[]) => {
      return occasions.filter((occasion) => {
        return !selectedOccasions.some(
          (selectedOccasion) => selectedOccasion.id === occasion.id
        );
      });
    },
    [selectedOccasions]
  );

  const filteredOccasions = useMemo(() => {
    return filterOccasions(occasions);
  }, [filterOccasions, occasions]);

  const handleSelectedOccasionsChange = useCallback((value: ChipValue[]) => {
    setSelectedOccasions(value);
  }, []);

  const handleSelectOccasion = useCallback((value: ChipValue | null) => {
    if (value) {
      setSelectedOccasions((prev) => [...prev, value]);
    }
  }, []);

  useEffect(() => {
    OccasionService.GetAll()
      .then((occasions) => setOccasions(occasions))
      .catch(() => setOccasions([]));
  }, []);

  //#endregion
  //#region Data Actions

  const validateNewRecipe = useCallback((): {
    isValid: boolean;
    msg: string;
  } => {
    function setInvalid(message: string) {
      isValid = false;
      msg = message;
    }

    let isValid = true;
    let msg = '';

    if (!newRecipe) {
      setInvalid(LocalMessageConstant.Validation.InvalidData);
    } else if (!newRecipe.name) {
      setInvalid(LocalMessageConstant.Validation.NameRequired);
    } else if (!newRecipe.ingredients || newRecipe.ingredients.length === 0) {
      setInvalid(LocalMessageConstant.Validation.IngredientRequired);
    } else if (!newRecipe.directions || newRecipe.directions.length === 0) {
      setInvalid(LocalMessageConstant.Validation.DirectionRequired);
    } else if (newRecipe.totalTime <= 0) {
      setInvalid(LocalMessageConstant.Validation.TotalTimeRequired);
    }

    return { isValid, msg };
  }, [newRecipe]);

  /**
   * Creates a new recipe request.
   * Data must have been validated before calling this method.
   */
  const createPostRecipeData = useCallback(async (): Promise<RecipeReq> => {
    if (!user) {
      throw new ReferenceError(CommonMessage.Auth.NullUser);
    }

    const imageId = uuidv4();

    let path = '';
    if (recipeThumbnailFile) {
      path = `${StoragePath.RECIPE}/${imageId}.${getFileExtension(
        recipeThumbnailFile.name
      )}`;

      path = await uploadImage(recipeThumbnailFile, path);
    }

    const directionsWithImage = await resolveDirectionsImage(
      newRecipe.directions,
      imageId
    );

    const postRecipeData: RecipeReq = {
      name: newRecipe.name,
      introduction: newRecipe.introduction,
      image: path || undefined,
      totalTime: newRecipe.totalTime,
      serving_size: newRecipe.servingSize,
      occasions: selectedOccasions.map((o) => o.id),
      ingredients: newRecipe.ingredients.map((ingredient) => ({
        id: ingredient.ingredientId,
        amount: ingredient.amount,
      })),
      directions: directionsWithImage,
      author_note: newRecipe.authorNote,
      author: user.uid,
      is_private: newRecipe.isPrivate,
      rating: 0,
    };

    return postRecipeData;
  }, [
    newRecipe.authorNote,
    newRecipe.directions,
    newRecipe.ingredients,
    newRecipe.introduction,
    newRecipe.isPrivate,
    newRecipe.name,
    newRecipe.servingSize,
    newRecipe.totalTime,
    recipeThumbnailFile,
    selectedOccasions,
    user,
  ]);

  const clearForm = useCallback(() => {
    setNewRecipe(DEFAULT_NEW_RECIPE);
    setRecipeThumbnailFile(null);
    setSelectedOccasions([]);
  }, []);

  const handleCreateRecipe = useCallback(async () => {
    setIsProcessing(true);

    try {
      const { isValid: isLocalValid, msg: localMsg } = validateNewRecipe();

      console.log('isLocalValid', isLocalValid, localMsg);

      if (!isLocalValid) {
        console.log(createDebugString(localMsg));
        snackbarAlert(localMsg, 'warning');
        setIsProcessing(false);
        return;
      }

      const postData = await createPostRecipeData();

      console.log(postData);

      const result = await RecipeService.CreateRecipe(postData);

      if (result) {
        try {
          const cookBook = await CookbookService.GetAllCookBookByAccountId(
            user?.uid ?? ''
          );
          if (cookBook && cookBook.length > 0) {
            await RecipeService.AddRecipeToCookBook({
              cook_book_id: cookBook[0].id,
              recipe_id: result.id,
            });
          }
          snackbarAlert('Công thức tạo thành công!', 'success');

          clearForm();
          navigate(PageRoute.Recipe.Detail(result.id));
        } catch (error) {
          //empty
        }
      } else {
        snackbarAlert('Công thức tạo thất bại!', 'warning');
      }
    } catch (e) {
      console.log(createDebugString(e));
      snackbarAlert(e.message, 'warning');
    } finally {
      setIsProcessing(false);
    }
  }, [
    clearForm,
    createPostRecipeData,
    navigate,
    snackbarAlert,
    user?.uid,
    validateNewRecipe,
  ]);
  //#endregion
  //#region Ingredients

  const [ingredientSelectModalOpen, setIngredientSelectModalOpen] =
    useState(false);

  const handleIngredientSelectModalOpen = useCallback(() => {
    setIngredientSelectModalOpen(true);
  }, []);

  const handleIngredientSelectModalClose = useCallback(() => {
    setIngredientSelectModalOpen(false);
  }, []);

  const handleAddIngredient = useCallback(
    (newIngredient: IngredientItemData) => {
      setIngredientSelectModalOpen(false);
      handleNewRecipeFieldChange('ingredients', [
        ...newRecipe.ingredients,
        newIngredient,
      ]);
    },
    [handleNewRecipeFieldChange, newRecipe.ingredients]
  );

  const handleIngredientsChange = useCallback(
    (ingredients: IngredientItemData[]) => {
      handleNewRecipeFieldChange('ingredients', ingredients);
    },
    [handleNewRecipeFieldChange]
  );

  //#endregion
  //#region Directions

  const handleDirectionsChange = useCallback(
    (directions: DirectionEditorItemValue[]) => {
      setNewRecipe((prev) => ({
        ...prev,
        directions: directions,
      }));
    },
    []
  );

  //#endregion
  //#region Edit Mode

  const [editRecipe, setEditRecipe] = useState<RecipeRes | null>(null);
  // Load data if it is edit mode
  useEffect(() => {
    if (!edit) return;
    handleSpinner(true);

    const intId = parseInt(id);

    RecipeService.GetById(intId)
      .then((recipe) => {
        if (!recipe) return;

        setNewRecipe({
          name: recipe.name,
          // activeTime: recipe.activeTime, // not exist
          // authorNote: recipe.authorNote, // not exist
          activeTime: 0, // not exist
          authorNote: 'placeholder for retrieved note', // not exist
          directions: recipe.directions.map(
            (direction) =>
              ({
                direction: direction.direction,
                step: direction.step,
                imageFile: null,
                imagePath: direction.image,
              } as DirectionEditorItemValue)
          ),
          ingredients: recipe.ingredients.map((ingredient) => ({
            id: nanoid(6),
            ingredientId: ingredient.id,
            name: ingredient.name,
            amount: ingredient.amount,
          })),
          introduction: recipe.introduction,
          image: recipe.image,
          // isPrivate: recipe.isPrivate, // not exist
          isPrivate: true,
          servingSize: recipe.serving_size,
          totalTime: dateTimeToMinutes(recipe.totalTime),
          occasions: recipe.occasions?.map((occasion) => occasion.id) || [],
        });
        setEditRecipe(recipe);
        console.log(recipe.occasions);
        setSelectedOccasions(
          recipe.occasions.map((occasion) => ({
            id: occasion.id,
            name: occasion.name,
          }))
        );
      })
      .catch((err) => {
        console.log(err);
        setEditRecipe(null);
      })
      .finally(() => handleSpinner(false));
  }, [edit, handleSpinner, id]);

  const updateComplexStuffs = useCallback(
    async (recipe: RecipeReq): Promise<RecipeReq> => {
      console.log('Function updateComplexStuffs invoked with recipe:', recipe);

      if (!recipe) return null;

      const updatedRecipe = { ...recipe };

      console.log('Updated recipe initialized:', updatedRecipe);

      if (recipeThumbnailFile) {
        console.log('Uploading recipe thumbnail...');
        let path = '';
        try {
          if (updatedRecipe.image) {
            path = await uploadImage(recipeThumbnailFile, updatedRecipe.image);
          } else {
            const id = uuidv4();
            const extension = getFileExtension(recipeThumbnailFile.name);
            path = await uploadImage(
              recipeThumbnailFile,
              `${StoragePath.RECIPE}/${id}.${extension}`
            );
          }
        } catch (err) {
          console.log(err);
        }
        console.log('Thumbnail uploaded, path:', path);
        updatedRecipe.image = path;
      }

      // Directions-related logic
      let directionsChange = false;

      // Check for changes in directions
      if (updatedRecipe.directions.length !== newRecipe.directions.length) {
        directionsChange = true;
        console.log('Directions lengths differ, triggering change');
      } else {
        for (let i = 0; i < updatedRecipe.directions.length; i++) {
          if (
            newRecipe.directions[i].imageFile ||
            newRecipe.directions[i].direction !==
              updatedRecipe.directions[i].direction
          ) {
            directionsChange = true;
            console.log('Direction change detected at index', i);
            break;
          }
        }
      }

      if (directionsChange) {
        console.log('Updating directions...');
        // Delete old images
        for (const direction of updatedRecipe.directions) {
          if (direction.image) {
            console.log('Deleting image:', direction.image);
            try {
              await deleteImage(direction.image);
            } catch (err) {
              console.log(err);
            }
          }
        }

        const imageId = updatedRecipe.image.split('/')[1].split('.')[0];
        updatedRecipe.directions = await resolveDirectionsImage(
          newRecipe.directions,
          imageId
        );
        console.log('Directions updated:', updatedRecipe.directions);
      }

      return updatedRecipe;
    },
    [newRecipe.directions, recipeThumbnailFile]
  );

  const handleSaveRecipe = useCallback(async () => {
    setIsProcessing(true);

    const recipeId = parseInt(id);
    let putBody = createPutBody(
      editRecipe,
      newRecipe,
      selectedOccasions.map((s) => s.id)
    );
    putBody = await updateComplexStuffs(putBody);

    RecipeService.Update(recipeId, putBody)
      .then(() => {
        navigate(`/recipe/${recipeId}`);
      })
      .catch((err) => {
        console.log(err);
        snackbarAlert('Cập nhật công thức thất bại!', 'error');
      })
      .finally(() => setIsProcessing(false));
  }, [
    editRecipe,
    id,
    navigate,
    newRecipe,
    selectedOccasions,
    snackbarAlert,
    updateComplexStuffs,
  ]);

  //#endregion

  console.log(newRecipe);

  return (
    <Layout withFooter={false} headerPosition="static" isDynamicHeader={false}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#F0F0F0',
          py: 4,
        }}
      >
        <Card
          sx={{
            borderRadius: 12,
            p: 4,
            width: { xs: '96%', sm: '70%', md: '60%' },
            bgcolor: '#FFFAF9',
          }}
        >
          <CardContent>
            <Stack gap={4}>
              <FormTitle>Viết công thức cho chính bạn</FormTitle>
              <Stack>
                <FormLabel>Tên công thức</FormLabel>
                <TastealTextField
                  value={newRecipe.name}
                  disabled={isProcessing}
                  onChange={(e) =>
                    handleNewRecipeFieldChange('name', e.target.value)
                  }
                  placeholder="Nhập tên công thức"
                />
              </Stack>
              <Stack>
                <FormLabel>Giới thiệu (Không bắt buộc)</FormLabel>
                <TastealTextField
                  value={newRecipe.introduction}
                  disabled={isProcessing}
                  onChange={(e) =>
                    handleNewRecipeFieldChange('introduction', e.target.value)
                  }
                  multiline
                  rows={2}
                  placeholder={`Viết những dòng giới thiệu cho công thức của bạn`}
                />
              </Stack>
              <Stack gap={1}>
                <FormLabel>Dịp</FormLabel>
                <Autocomplete
                  disabled={isProcessing}
                  options={[null, ...filteredOccasions]}
                  getOptionLabel={(o) => o?.name || 'Chọn dịp'}
                  title="Chọn dịp"
                  placeholder="Chọn dịp cho công thức"
                  noOptionsText="Không tìm thấy dịp lễ nào"
                  renderInput={(params) => (
                    <TastealTextField {...params} label="Chọn dịp" />
                  )}
                  onChange={(_, value) => handleSelectOccasion(value)}
                  isOptionEqualToValue={(option, value) => {
                    if (value === null || option === null) return true;
                    return option.id === value.id;
                  }}
                  value={null}
                />
                <ChipsDisplayer
                  chips={selectedOccasions}
                  onChange={handleSelectedOccasionsChange}
                />
              </Stack>
              <Stack>
                <FormLabel>Thêm hình bìa</FormLabel>
                <ImagePicker
                  file={recipeThumbnailFile}
                  imagePath={newRecipe.image}
                  onChange={handleRecipeThumbnailChange}
                  disabled={isProcessing}
                />
              </Stack>
              <Stack>
                <FormLabel>Khẩu phần ăn</FormLabel>
                <ServingSizeSelect
                  disabled={isProcessing}
                  servingSize={newRecipe.servingSize}
                  sizes={ServingSizes}
                  onServingSizeChange={(size) =>
                    handleNewRecipeFieldChange('servingSize', size)
                  }
                />
              </Stack>
              <Stack>
                <FormLabel>Nguyên liệu</FormLabel>
                <IngredientSelector
                  disabled={isProcessing}
                  ingredients={newRecipe.ingredients}
                  onChange={handleIngredientsChange}
                  onOpen={handleIngredientSelectModalOpen}
                />
              </Stack>
              <Stack>
                <FormLabel>Hướng dẫn</FormLabel>
                <DirectionEditor
                  disabled={isProcessing}
                  directions={newRecipe.directions}
                  onChange={handleDirectionsChange}
                />
              </Stack>
              <Stack>
                <FormLabel>Tổng thời gian</FormLabel>
                <TastealTextField
                  value={newRecipe.totalTime}
                  onChange={(e) =>
                    handleNewRecipeFieldChange(
                      'totalTime',
                      parseInt(e.target.value)
                    )
                  }
                  placeholder="Tổng thời gian"
                  type="number"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">phút</InputAdornment>
                    ),
                  }}
                  disabled={isProcessing}
                />
              </Stack>
              <Stack>
                <FormLabel>Ghi chú của tác giả (Không bắt buộc)</FormLabel>
                <TastealTextField
                  value={newRecipe.authorNote}
                  disabled={isProcessing}
                  onChange={(e) =>
                    handleNewRecipeFieldChange('authorNote', e.target.value)
                  }
                  multiline
                  rows={2}
                  placeholder={`Thêm mẹo / lưu ý cho công thức này`}
                />
              </Stack>
              <Stack
                sx={{
                  display: 'none',
                }}
              >
                <RadioGroup
                  value={newRecipe.isPrivate}
                  onChange={(e) =>
                    handleNewRecipeFieldChange(
                      'isPrivate',
                      e.target.value === 'true'
                    )
                  }
                  defaultValue={false}
                  name="isRecipePrivate"
                >
                  <FormControlLabel
                    value={false}
                    control={<Radio />}
                    label="Riêng tư"
                    disabled={isProcessing}
                  />
                  <FormControlLabel
                    value={true}
                    control={<Radio />}
                    label="Công khai"
                    disabled={isProcessing}
                  />
                </RadioGroup>
              </Stack>
              <Stack>
                <RoundedButton
                  variant="contained"
                  disabled={isProcessing}
                  onClick={edit ? handleSaveRecipe : handleCreateRecipe}
                  sx={{
                    height: 40,
                  }}
                >
                  {isProcessing ? (
                    <CircularProgress size={20} />
                  ) : edit ? (
                    'Cập nhật'
                  ) : (
                    'Hoàn thành'
                  )}
                </RoundedButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <NewIngredientModal
        open={ingredientSelectModalOpen}
        onClose={handleIngredientSelectModalClose}
        onAddIngredient={handleAddIngredient}
      />
    </Layout>
  );
};

function createPutBody(
  recipe: RecipeRes,
  newRecipe: NewRecipe,
  occasions: number[]
) {
  const putBody: RecipeReq = {
    name: newRecipe.name,
    introduction: newRecipe.introduction,
    image: recipe.image,
    rating: recipe.rating,
    directions: recipe.directions,
    ingredients: newRecipe.ingredients.map(
      (ingredient) =>
        ({
          id: ingredient.ingredientId,
          amount: ingredient.amount,
        } as Recipe_IngredientReq)
    ),
    author_note: newRecipe.authorNote,
    is_private: newRecipe.isPrivate,
    serving_size: newRecipe.servingSize,
    totalTime: newRecipe.totalTime,
    author: recipe.author.uid,
    occasions: occasions,
  };

  return putBody;
}

export default CreateRecipe;
