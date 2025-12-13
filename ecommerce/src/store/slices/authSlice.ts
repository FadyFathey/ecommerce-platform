import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';

import type { ILoggedUserData, ILoggedUserResponse, IUserType } from '../../../types/authTypes';



/**

 * Interface for the entire authentication state in Redux.

 */

interface AuthState {

  user: User | null;

  session: Session | null;

  loading: boolean;

  error: string | null;

  loggedUser: ILoggedUserResponse; 

}



// =========================================================================

// ASYNC THUNKS - User Registration (createUser)

// =========================================================================



export const createUser = createAsyncThunk(

  'auth/createUser',

  async (userData: IUserType, thunkApi) => {

    const { email, password, name, phone } = userData;



    // First sign up the user

    const { data, error } = await supabase.auth.signUp({

      email,

      password,

      options: {

        data: { 

          name,

          phone: phone || null

        },

        emailRedirectTo: window.location.origin, // Redirect to home after email confirmation (though disabled)

      },

    });



    

    // If signup is successful, update the user's email_confirmed_at to skip email confirmation

    if (data?.user && !error) {

      const { error: updateError } = await supabase

        .from('users')

        .update({ email_confirmed_at: new Date().toISOString() })

        .eq('id', data.user.id);



      if (updateError) {

        console.error('Error updating user confirmation status:', updateError);

      }

    }



    if (error) return thunkApi.rejectWithValue(error.message);



    return data;

  }

);





// =========================================================================

// ASYNC THUNKS - User Login (userLogin)

// =========================================================================



export const userLogin = createAsyncThunk<ILoggedUserResponse, ILoggedUserData>(

   "auth/login",

   async(userLoged:ILoggedUserData,thunkApi)=>

   {

    let { data, error } = await supabase.auth.signInWithPassword({

     email: userLoged.email,

     password: userLoged.password

    })

    

    if(error){

    return thunkApi.rejectWithValue(error.message || "Login failed")

    }

    

    if(data.user)

    {

     const userName = data.user.user_metadata?.name || '';

     return {

      id: data.user.id,

      email: data.user.email || '',

      name: userName,

      }

    }

    

    return thunkApi.rejectWithValue({ message: "No user data found after login." });

   });


// =========================================================================

// ASYNC THUNKS - User Logout 

// =========================================================================

export const userLogOut = createAsyncThunk("auth/logout",async(_,thunkApi)=>
  {
    let { error } = await supabase.auth.signOut()
    if(error)
    {
      return thunkApi.rejectWithValue(error)
    }
  })


// =========================================================================

// ASYNC THUNKS - Check User exists 

// =========================================================================



export const checkUserLogin = createAsyncThunk<Session | null, void>("auth/check", async (_, thunkApi) => {

    

  const { data: { session }, error } = await supabase.auth.getSession();

  

  if (error) {

      return thunkApi.rejectWithValue(error.message || "Failed to check session."); 

  }

  

  return session; 

});



// =========================================================================

// ASYNC THUNKS - Forgot Password 

// =========================================================================



export const forgotPassword = createAsyncThunk<void, string>("auth/forgotPassword", async (email, thunkApi) => {

  const { error } = await supabase.auth.resetPasswordForEmail(email, {

    redirectTo: `${window.location.origin}/reset-password`,

  });

  

  if (error) {

    return thunkApi.rejectWithValue(error.message || "Failed to send password reset email.");

  }

  

  return;

});


// =========================================================================

// ASYNC THUNKS - Reset Password 

// =========================================================================



export const resetPassword = createAsyncThunk<void, string>("auth/resetPassword", async (newPassword, thunkApi) => {

  const { error } = await supabase.auth.updateUser({

    password: newPassword,

  });

  

  if (error) {

    return thunkApi.rejectWithValue(error.message || "Failed to update password.");

  }

  

  return;

});



// =========================================================================

// INITIAL STATES

// =========================================================================



const LoggedUserinitialState: ILoggedUserResponse = {

  id:"",

  email:"",

  name:""

};



const initialState: AuthState = {

  user: null,

  session: null,

  loading: false,

  error: null,

  loggedUser: LoggedUserinitialState 

};





// =========================================================================

// AUTH SLICE

// =========================================================================



const authSlice = createSlice({

  name: 'auth',

  initialState,

  reducers: {},

  extraReducers: (builder) => {

    builder

      // --- CREATE USER Cases ---

      .addCase(createUser.pending, (state) => {

        state.loading = true;

        state.error = null;

      })

      .addCase(createUser.fulfilled, (state, action) => {

        state.loading = false;

        state.user = action.payload?.user || null;

        state.session = action.payload?.session || null;

      })

      .addCase(createUser.rejected, (state, action) => {

        state.loading = false;

        state.error = action.payload as string;

      })

      // --- LOGIN Cases ---

      .addCase(userLogin.pending,(state)=>

      {

        state.loading = true;

        state.error = null;

      })

      .addCase(userLogin.fulfilled,(state,action)=>

        {

          state.loading = false;

          state.error = null;

          state.loggedUser=action.payload

        })

      .addCase(userLogin.rejected, (state, action) => {

          state.loading = false;

          state.error = (action.payload as string) || action.error.message || "Login failed";

          state.loggedUser = LoggedUserinitialState;

        })

        // --- LOGOUT Cases ---

        .addCase(userLogOut.pending, (state) => {
  
          state.loading = true;
  
          state.error = null;
  
        })
  
        .addCase(userLogOut.fulfilled, (state) => {
  
          state.loading = false;
  
          state.error = null;
  
          // Resetting all user-related state fields to initial values
  
          state.user = null;
  
          state.session = null;
  
          state.loggedUser = LoggedUserinitialState; 
  
        })
  
        .addCase(userLogOut.rejected, (state, action) => {
  
          state.loading = false;
  
          // We generally keep the user logged in if logout fails unexpectedly
  
          state.error = (action.payload as any)?.message || "Logout failed.";
  
        })
        // check Check User exists 
        .addCase(checkUserLogin.pending,(state)=>
          {
            state.loading = true;  
            state.error = null;
          }).addCase(checkUserLogin.fulfilled,(state,action)=>
            {
              state.loading = false;
              state.session=action.payload;
            }).addCase(checkUserLogin.rejected,(state,action)=>
              {
                state.loading = false; 
                state.error = (action.payload as any)?.message || "Session check failed.";
                state.session = null;
               state.user = null;
              })
        // --- FORGOT PASSWORD Cases ---
        .addCase(forgotPassword.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(forgotPassword.fulfilled, (state) => {
          state.loading = false;
          state.error = null;
        })
        .addCase(forgotPassword.rejected, (state, action) => {
          state.loading = false;
          state.error = (action.payload as string) || "Failed to send password reset email.";
        })
        // --- RESET PASSWORD Cases ---
        .addCase(resetPassword.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(resetPassword.fulfilled, (state) => {
          state.loading = false;
          state.error = null;
        })
        .addCase(resetPassword.rejected, (state, action) => {
          state.loading = false;
          state.error = (action.payload as string) || "Failed to update password.";
        })
        ;

  },

});





export default authSlice.reducer;