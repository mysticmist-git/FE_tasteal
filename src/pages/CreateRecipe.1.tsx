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
import { ServingSizes } from '@/lib/constants/options';
import { StoragePath } from '@/lib/constants/storage';
import AppContext from '@/lib/contexts/AppContext';
import { deleteImage, uploadImage } from '@/lib/firebase/image';
import useSnackbarService from '@/lib/hooks/useSnackbar';
import { RecipeReq } from '@/lib/models/dtos/Request/RecipeReq/RecipeReq';
import { RecipeRes } from '@/lib/models/dtos/Response/RecipeRes/RecipeRes';
import OccasionService from '@/lib/services/occasionService';
import RecipeService from '@/lib/services/recipeService';
import { CommonMessage } from '@/utils/constants/message';
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
import {
  DEFAULT_NEW_RECIPE,
  LocalMessageConstant,
  NewRecipe,
  createDebugString,
  createPutBody,
  resolveDirectionsImage,
} from './CreateRecipe';

//#endregion
export const CreateRecipe: React.FunctionComponent<{ edit?: boolean }> = ({
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
    } else if (
      newRecipe.activeTime > 0 &&
      newRecipe.activeTime > newRecipe.totalTime
    ) {
      setInvalid(LocalMessageConstant.Validation.InvalidActiveTime);
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

      RecipeService.CreateRecipe(postData)
        .then((response) => {
          console.log(response);
          snackbarAlert('Công thức tạo thành công!', 'success');
          clearForm();
          navigate(`/recipe/${response.id}`);
        })
        .catch((e) => {
          console.log(createDebugString(e.message ?? 'Unknown error'));
          snackbarAlert('Công thức tạo thất bại!', 'warning');
        });
    } catch (e) {
      console.log(createDebugString(e));
      snackbarAlert(e.message, 'warning');
    } finally {
      setIsProcessing(false);
    }
  }, [clearForm, createPostRecipeData, snackbarAlert, validateNewRecipe]);
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
          activeTime: 0,
          authorNote: 'placeholder for retrieved note',
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
            ingredientId: ingredient.Id,
            name: ingredient.name,
            amount: ingredient.amount,
          })),
          introduction: recipe.introduction,
          image: recipe.image,
          // isPrivate: recipe.isPrivate, // not exist
          isPrivate: true,
          servingSize: recipe.serving_size,
          totalTime: dateTimeToMinutes(recipe.totalTime),
        });
        setEditRecipe(recipe);
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
    console.log(newRecipe);

    const recipeId = parseInt(id);
    let putBody = createPutBody(editRecipe, newRecipe);
    console.log('body', putBody);
    putBody = await updateComplexStuffs(putBody);

    console.log('id', putBody);
    console.log('body', putBody);

    RecipeService.Update(recipeId, putBody)
      .then(() => {
        navigate(`/recipe/${recipeId}`);
      })
      .catch((err) => {
        console.log(err);
        snackbarAlert('Cập nhật công thức thất bại!', 'error');
      })
      .finally(() => setIsProcessing(false));
  }, [editRecipe, id, navigate, newRecipe, snackbarAlert, updateComplexStuffs]);

  //#endregion
  return (
    <Layout withFooter={false}>
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
            width: '52%',
            borderRadius: 12,
            p: 4,
            bgcolor: '##FFFAF9',
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
                  options={filteredOccasions}
                  getOptionLabel={(o) => o.name}
                  title="Chọn dịp"
                  placeholder="Chọn dịp cho công thức"
                  noOptionsText="Không tìm thấy dịp lễ nào"
                  renderInput={(params) => (
                    <TastealTextField {...params} label="Chọn dịp" />
                  )}
                  onChange={(_, value) => handleSelectOccasion(value)}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                />
                <ChipsDisplayer
                  chips={selectedOccasions}
                  onChange={handleSelectedOccasionsChange}
                />
              </Stack>
              <Stack>
                <FormLabel>Thêm hình bìa (Không bắt buộc)</FormLabel>
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
              <Stack>
                <RadioGroup
                  value={newRecipe.isPrivate}
                  onChange={(e) =>
                    handleNewRecipeFieldChange(
                      'isPrivate',
                      e.target.value === 'true'
                    )
                  }
                  defaultValue={true}
                  name="isRecipePrivate"
                >
                  <FormControlLabel
                    value={true}
                    control={<Radio />}
                    label="Người khác không thể xem"
                    disabled={isProcessing}
                  />
                  <FormControlLabel
                    value={false}
                    control={<Radio />}
                    label="Chia sẻ công thức thông qua link"
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