import { getApiUrl } from '@/lib/constants/api';
import { recipes as recipesSampleData } from '@/lib/constants/sampleData';
import { RecipeRes } from '@/lib/models/dtos/Response/RecipeRes/RecipeRes';
import { createDebugStringFormatter } from '@/utils/debug/formatter';
import simulateDelay from '@/utils/promises/stimulateDelay';
import { DefaultPage } from '../constants/common';
import { deleteImage } from '../firebase/image';
import { PageFilter } from '../models/dtos/Request/PageFilter/PageFilter';
import { RecipeReq } from '../models/dtos/Request/RecipeReq/RecipeReq';
import { RecipeSearchReq } from '../models/dtos/Request/RecipeSearchReq/RecipeSearchReq';
import { RecipeEntity } from '../models/entities/RecipeEntity/RecipeEntity';
import { PageReq } from '../models/dtos/Request/PageReq/PageReq';
import { KeyWordRes } from '../models/dtos/Response/KeyWordRes/KeyWordRes';

const DEBUG_IDENTIFIER = '[RecipeService]';
const createDebugString = createDebugStringFormatter(DEBUG_IDENTIFIER);

// Cache system
type RecipeCache = Map<number, RecipeRes>;
const recipeCache: RecipeCache = new Map();

/**
 * Represents a service for managing occasions.
 */
class RecipeService {
    /**
     * Retrieves all occasions.
     *
     * @return {Promise<RecipeEntity[]>}
     */
    public static async GetAllRecipes(
        pageSize: number = 12,
        page: number = 1
    ): Promise<RecipeEntity[]> {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                pageSize: pageSize,
                page: page,
            } as PageReq),
        };

        return await fetch(getApiUrl('GetAllRecipe'), requestOptions)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                return data;
            })
            .catch((error) => {
                console.error('Lỗi:', error);
            });
    }
    /**
     * Get recipe detail data by id.
     * NOTE: This method is not implemented yet.
     *
     * @param id - The id of the recipe.
     * @returns - The recipe detail data.
     */
    public static GetById(id: number): Promise<RecipeRes> {
        if (recipeCache.has(id)) {
            console.log('Use data in cache');
            return Promise.resolve(recipeCache.get(id)!);
        }

        return fetch(`${getApiUrl('GetRecipe')}?id=${id}`, {
            method: 'POST',
        })
            .then((response) => response.json())
            .then((data) => {
                recipeCache.set(id, data);
                return data;
            })
            .catch((err) => {
                throw err;
            });
    }

    /**
     * Fetch recipes that belong to a specific account.
     *
     * @param accountId - The id of the account.
     * @returns
     */
    public static GetByAccountId(accountId: string) {
        // Simulate delay of 1 second
        simulateDelay(1);

        return Promise.resolve(
            recipesSampleData.filter((recipe) => recipe.author === accountId)
        );
    }

    public static async GetNewReleaseRecipes(
        limit: number
    ): Promise<RecipeEntity[]> {
        let recipes: RecipeEntity[] = [];

        const requestOptions: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                pageSize: limit,
                page: DefaultPage,
                isDescend: true,
            } as PageFilter),
        };

        await fetch(getApiUrl('GetRecipeByDateTime'), requestOptions)
            .then((response) => response.json())
            .then((data) => {
                recipes = data;
            })
            .catch((error) => {
                console.error('Lỗi:', error);
            });

        console.log(recipes);

        return recipes;
    }

    public static async GetTrendingRecipes(
        limit: number
    ): Promise<RecipeEntity[]> {
        let recipes: RecipeEntity[] = [];

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                pageSize: limit,
                page: DefaultPage,
                isDescend: true,
            } as PageFilter),
        };

        await fetch(getApiUrl('GetRecipeByRating'), requestOptions)
            .then((response) => response.json())
            .then((data) => {
                recipes = data;
            })
            .catch((error) => {
                console.error('Lỗi:', error);
            });

        return recipes;
    }

    public static async SearchRecipes(
        filter: RecipeSearchReq
    ): Promise<RecipeEntity[]> {
        let recipes: RecipeEntity[] = [];

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                ...filter,
            }),
        };

        await fetch(getApiUrl('SearchRecipe'), requestOptions)
            .then((response) => response.json())
            .then((data) => {
                recipes = data;
            })
            .catch((error) => {
                console.error('Lỗi:', error);
            });

        return recipes;
    }
    //#region POST

    /**
     * Create a new recipe
     */
    public static async CreateRecipe(postData: RecipeReq) {
        fetch(getApiUrl('CreateRecipe'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        })
            .then((response: Response) => response.json())
            .then((data: RecipeReq) => {
                console.log(
                    createDebugString('POST succeeded!', 'CreateRecipe'),
                    data
                );
                return data;
            })
            .catch((e) => {
                // Initial handle
                switch (e.code) {
                    default:
                        // TODO: test this
                        // This is not tested
                        deleteImage(postData.image).catch();
                        Promise.all(
                            postData.directions.map((direction) =>
                                deleteImage(direction.image)
                            )
                        ).catch();
                        break;
                }

                const msg = createDebugString('POST fail!', 'CreateRecipe');
                console.error(msg, e);
                return Promise.reject(e);
            });
    }

    //#endregion

    public static async GetKeyWords(): Promise<KeyWordRes[]> {
        const requestOptions = {
            method: 'GET',
        };

        return await fetch(getApiUrl('GetKeyWords'), requestOptions)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                return data;
            })
            .catch((error) => {
                console.error('Lỗi:', error);
            });
    }
}

export default RecipeService;
