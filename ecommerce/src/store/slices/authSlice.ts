import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';
import { setRememberMe } from '../../lib/storage';

import type { ILoggedUserData, ILoggedUserResponse, IUserType } from '../../types/authTypes';



/**

 * Interface for the entire authentication state in Redux.

 */

interface AuthState {

  user: User | null;

  session: Session | null;

  /**
   * Becomes true after at least one auth check finishes. Prevents guards from
   * redirecting before Supabase rehydrates the session on page refresh.
   */
  initialized: boolean;

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
    // Set remember me preference before login
    setRememberMe(userLoged.rememberMe || false)

    let { data, error } = await supabase.auth.signInWithPassword({

     email: userLoged.email,

     password: userLoged.password

    })

    

    if(error){

    return thunkApi.rejectWithValue(error.message || "Login failed")

    }

    

    if(data.user && data.session)

    {

     const userName = data.user.user_metadata?.name || '';

     return {

      id: data.user.id,

      email: data.user.email || '',

      name: userName,

      session: data.session,
      user: data.user

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
  try {
    // First, try to get the session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      // Don't reject immediately, try to refresh
    }
    
    // If we have a session, return it
    if (session) {
      return session;
    }
    
    // If no session, try to refresh using the refresh token
    // This will work if we have a valid refresh token in storage
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshedSession && !refreshError) {
      return refreshedSession;
    }
    
    // If refresh also fails, return null (user needs to login)
    if (refreshError) {
      console.log('No valid session found, user needs to login');
    }
    
    return null;
  } catch (error: any) {
    console.error('Error checking session:', error);
    return thunkApi.rejectWithValue(error.message || "Failed to check session.");
  }
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
export const updateUser = createAsyncThunk<void, { name: string, phone: string }>("auth/updateUser", async ({ name, phone }, thunkApi) => {
  const { error } = await supabase.auth.updateUser({
    data: {
      name: name,
      phone: phone,
    }
  });
  if (error) {
    return thunkApi.rejectWithValue(error.message || "Failed to update user.");
  }
  
  return;
});

const LoggedUserinitialState: ILoggedUserResponse = {

  id:"",

  email:"",

  name:""

};



const initialState: AuthState = {

  user: null,

  session: null,

  initialized: false,

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

  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.loggedUser = LoggedUserinitialState;
    }
  },

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
        state.initialized = false;

        state.error = null;

      })

      .addCase(userLogin.fulfilled,(state,action)=>

        {

          state.loading = false;
          state.initialized = true;

          state.error = null;

          state.loggedUser = {
            id: action.payload.id,
            email: action.payload.email,
            name: action.payload.name
          };
          
          // Set session and user if they exist in the payload
          if ((action.payload as any).session) {
            state.session = (action.payload as any).session;
          }
          if ((action.payload as any).user) {
            state.user = (action.payload as any).user;
          }
        })

      .addCase(userLogin.rejected, (state, action) => {

          state.loading = false;
          state.initialized = true;

          state.error = (action.payload as string) || action.error.message || "Login failed";

          state.loggedUser = LoggedUserinitialState;

        })

        // --- LOGOUT Cases ---

        .addCase(userLogOut.pending, (state) => {
  
          state.loading = true;
          state.initialized = false;
  
          state.error = null;
  
        })
  
        .addCase(userLogOut.fulfilled, (state) => {
  
          state.loading = false;
          state.initialized = true;
  
          state.error = null;
  
          // Resetting all user-related state fields to initial values
  
          state.user = null;
  
          state.session = null;
  
          state.loggedUser = LoggedUserinitialState; 
  
        })
  
        .addCase(userLogOut.rejected, (state, action) => {
  
          state.loading = false;
          state.initialized = true;
  
          // We generally keep the user logged in if logout fails unexpectedly
  
          state.error = (action.payload as any)?.message || "Logout failed.";
  
        })
        // check Check User exists 
        .addCase(checkUserLogin.pending,(state)=>
          {
            state.loading = true;  
            state.initialized = false;
            state.error = null;
          }).addCase(checkUserLogin.fulfilled,(state,action)=>
            {
              state.loading = false;
              state.initialized = true;
              state.session=action.payload;
              
              // Also set user if session exists
              if (action.payload?.user) {
                state.user = action.payload.user;
                state.loggedUser = {
                  id: action.payload.user.id,
                  email: action.payload.user.email || '',
                  name: action.payload.user.user_metadata?.name || action.payload.user.raw_user_meta_data?.name || ''
                };
              } else {
                // Clear user data if no session
                state.user = null;
                state.loggedUser = LoggedUserinitialState;
              }
            }).addCase(checkUserLogin.rejected,(state,action)=>
              {
                state.loading = false; 
                state.initialized = true;
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