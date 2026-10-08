import recipes from '../../generated/recipe-items.json';
export type RecipeItem={title:string;path:string;tags:string[];isNew:boolean;order:number};
export const getRecipes=(version:string):RecipeItem[]=>recipes[version];
