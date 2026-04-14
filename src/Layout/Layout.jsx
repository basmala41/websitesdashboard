import React from 'react';
import Sidebar from './Sidebar';
import { Routes, Route } from 'react-router-dom';
import Home from '../components/Home/Home';
import Header from './Header';
import styles from '../styles/sidebar.module.css';
import Category from '../components/Category/Category';
import Colors from '../components/Colors/Colors';
import Banner from '../components/Banner/Banner';
import Branches from '../components/Branches/Branches';
import Order from '../components/Order/Order';
import EditItems from '../components/Home/EditItems';
import Chat from '../components/Chat/Chat';
import Notifications from '../components/Notification/Notification';
import TermsandCondition from '../components/TermsAndConditions/TermsandCondition';
import Users from '../components/Users/Users'
import BestSellerImage from '../components/bestSellerImage/bestSellerImage';
import NewArrivalImage from '../components/NewArrivalImage/NewArrivalImage';
import CreateOrder from '../components/CreateOrder/CreateOrder';
import HomeVideo from '../components/HomeVideo/HomeVideo';
import ContactUs from '../components/ContactUs/ContactUs';
const Layout = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category" element={<Category />} />
          <Route path="/colors" element={<Colors />} />
          <Route path="/banner" element={<Banner />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/orders" element={<Order/>}/>
          <Route path="/editItem/:id" element={<EditItems/>} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
                    <Route path="/terms" element={<TermsandCondition />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/bestSellerImage" element={<BestSellerImage />} />
                    <Route path="/newArrivalImage" element={<NewArrivalImage />} />
                    <Route path='/createorder' element={<CreateOrder/>}/>
<Route path='/homeVideo' element={<HomeVideo/>}/>
<Route path='/contactUs' element={<ContactUs/>}/>
        </Routes>
      </div>
    </div>
  );
};

export default Layout;