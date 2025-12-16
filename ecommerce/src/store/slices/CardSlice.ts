import { createSlice ,createAsyncThunk } from "@reduxjs/toolkit";
import type { Product } from "../../types/productTypes";
import { supabase } from "../../lib/supabase";

interface CardState {
    products: Product[];
    selectedProduct: Product | null;
    loading: boolean;
    error: string | null;
}

const initialState: CardState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
};

export const getAllProducts = createAsyncThunk<Product[], void, { rejectValue: string }>(
    'card/getAllProducts',
    async (_, thunkApi) => {
        const { data, error } = await supabase
            .from('products')
            .select('*');
        if (error) {
            return thunkApi.rejectWithValue(error.message);
        }
        return data || [];
    }
);

export const cardSlice = createSlice({
    name: 'card',
    initialState,
    reducers: {},
    extraReducers:(builder)=>
        {
            builder
            .addCase(getAllProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllProducts.fulfilled, (state,action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(getAllProducts.rejected, (state,action) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong";
            })
        }
});

export default cardSlice.reducer;

