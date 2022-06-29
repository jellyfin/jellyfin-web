import React from 'react';
import { Route, Routes } from 'react-router-dom';

import ConnectionRequired from '../components/ConnectionRequired';
import NewUserPage from './NewUserPage';
import SearchPage from './search';
import UserEditPage from './UserEditPage';
import UserLibraryAccessPage from './UserLibraryAccessPage';
import UserParentalControl from './UserParentalControl';
import UserPasswordPage from './UserPasswordPage';
import UserProfilePage from './UserProfilePage';
import UserProfilesPage from './UserProfilesPage';

const AppRoutes = () => (
    <Routes>
        <Route path='/'>
            <Route
                path='search.html'
                element={
                    <ConnectionRequired>
                        <SearchPage />
                    </ConnectionRequired>
                }
            />
            <Route
                path='usernew.html'
                element={
                    <ConnectionRequired>
                        <NewUserPage />
                    </ConnectionRequired>
                }
            />
            <Route
                path='userprofiles.html'
                element={
                    <ConnectionRequired>
                        <UserProfilesPage />
                    </ConnectionRequired>
                }
            />
            <Route
                path='useredit.html'
                element={
                    <ConnectionRequired>
                        <UserEditPage />
                    </ConnectionRequired>
                }
            />
            <Route
                path='userLibraryAccessPage.html'
                element={
                    <ConnectionRequired>
                        <UserLibraryAccessPage />
                    </ConnectionRequired>
                }
            />
            <Route
                path='userparentalcontrol.html'
                element={
                    <ConnectionRequired>
                        <UserParentalControl />
                    </ConnectionRequired>
                }
            />
            <Route
                path='userpassword.html'
                element={
                    <ConnectionRequired>
                        <UserPasswordPage />
                    </ConnectionRequired>
                }
            />
            <Route
                path='myprofile.html'
                element={
                    <ConnectionRequired>
                        <UserProfilePage />
                    </ConnectionRequired>
                }
            />
            {/* Suppress warnings for unhandled routes */}
            <Route path='*' element={null} />
        </Route>
    </Routes>
);

export default AppRoutes;
