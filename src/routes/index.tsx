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
            {/* User routes */}
            <Route path='/' element={<ConnectionRequired />}>
                <Route path='search.html' element={<SearchPage />} />
                <Route path='myprofile.html' element={<UserProfilePage />} />
            </Route>

            {/* Admin routes */}
            <Route path='/' element={<ConnectionRequired isAdminRequired={true} />}>
                <Route path='usernew.html' element={<NewUserPage />} />
                <Route path='userprofiles.html' element={<UserProfilesPage />} />
                <Route path='useredit.html' element={<UserEditPage />} />
                <Route path='userlibraryaccess.html' element={<UserLibraryAccessPage />} />
                <Route path='userparentalcontrol.html' element={<UserParentalControl />} />
                <Route path='userpassword.html' element={<UserPasswordPage />} />
            </Route>

            {/* Suppress warnings for unhandled routes */}
            <Route path='*' element={null} />
        </Route>
    </Routes>
);

export default AppRoutes;
