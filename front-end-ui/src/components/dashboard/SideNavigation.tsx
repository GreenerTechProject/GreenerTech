import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SideNavigation: React.FC = () => {
  const [activeItem, setActiveItem] = useState<string>('map');
  const navigate = useNavigate();

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    console.log(`Navigating to ${itemId}`);

    // Add your navigation logic here
    if (itemId === 'alertes') {
      navigate({ to: '/alerts' });
    }
    // Add other navigation cases as needed
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Add your logout logic here
  };

  return (
    <div className="sidebar-container">
      {/* Background with shadow */}
      <div className="sidebar-shadow" />

      {/* Navigation Content */}
      <div className="navigation-content">
        {/* Map Button */}
        <button
          onClick={() => handleItemClick('map')}
          className="nav-button nav-button-map"
        >
          <div className="nav-icon map-icon">
            <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_9399_113)">
                <path d="M7.25 19.3482L1.76367 21.5455C1.51595 21.6438 1.25 21.4635 1.25 21.1968V5.50348C1.25 5.35387 1.34216 5.21318 1.49023 5.15289L1.48926 5.15192L7.25 2.85016V19.3482ZM17.75 4.82086V21.3228L10.25 19.1783V2.67633L17.75 4.82086ZM26.2354 2.45465C26.4832 2.35581 26.75 2.53645 26.75 2.80328V18.4966C26.75 18.6449 26.6594 18.7841 26.5137 18.8453L20.75 21.149V4.65094L26.2344 2.45367L26.2354 2.45465Z" stroke="#6C7072" strokeWidth="1.5"/>
              </g>
              <defs>
                <clipPath id="clip0_9399_113">
                  <path d="M0.5 0H27.5V24H0.5V0Z" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <span className="nav-text nav-text-map">Map</span>
        </button>

        {/* Surveillance Button */}
        <button
          onClick={() => handleItemClick('surveillance')}
          className="nav-button nav-button-surveillance"
        >
          <div className="nav-icon">
            <svg width="24" height="17" viewBox="0 0 24 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.66699 0.75H13.333C14.368 0.75 15.25 1.62549 15.25 2.75V13.75C15.25 14.8745 14.368 15.75 13.333 15.75H2.66699C1.63196 15.75 0.75 14.8745 0.75 13.75V2.75C0.75 1.62549 1.63196 0.75 2.66699 0.75ZM22.3486 2.22656C22.526 2.10527 22.7463 2.09283 22.9316 2.19336V2.19434C23.1217 2.29991 23.25 2.5096 23.25 2.75V13.75C23.25 13.9904 23.1217 14.2001 22.9316 14.3057C22.7493 14.4069 22.5296 14.3991 22.3496 14.2754L18.3496 11.5254H18.3506L18.083 11.3408V5.1582L18.3506 4.97461L18.3496 4.97363L22.3477 2.22559L22.3486 2.22656Z" stroke="#6C7072" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="nav-text">Surveillance</span>
        </button>

        {/* Alertes Button */}
        <button
          onClick={() => handleItemClick('alertes')}
          className="nav-button nav-button-alertes"
        >
          <div className="nav-icon">
            <svg width="21" height="19" viewBox="0 0 21 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.499 0.700195C10.8213 0.700195 11.1306 0.875352 11.3057 1.18457V1.18555L20.166 16.792V16.793C20.3434 17.1044 20.3441 17.494 20.1699 17.8086C19.9983 18.1183 19.6837 18.2998 19.3594 18.2998H1.63965C1.31524 18.2998 0.999756 18.1185 0.828125 17.8086C0.676834 17.5354 0.659827 17.1995 0.775391 16.9121L0.833008 16.792L9.69238 1.18555L9.69336 1.18457C9.86839 0.875465 10.1768 0.700273 10.499 0.700195ZM10.499 4.72852C9.54519 4.72863 8.81453 5.51796 8.81445 6.44629V11.1963C8.81445 12.0366 9.41355 12.7602 10.2344 12.8906C9.79223 12.9506 9.38194 13.1583 9.06836 13.4824C8.69363 13.8699 8.48633 14.3905 8.48633 14.9287C8.48636 15.4669 8.69366 15.9876 9.06836 16.375C9.44378 16.763 9.95778 16.9853 10.499 16.9854C11.0405 16.9854 11.5552 16.7632 11.9307 16.375C12.3054 15.9876 12.5117 15.4669 12.5117 14.9287C12.5117 14.3906 12.3053 13.8699 11.9307 13.4824C11.617 13.1581 11.206 12.9505 10.7637 12.8906C11.5847 12.7604 12.1836 12.0367 12.1836 11.1963V6.44629C12.1835 5.51789 11.453 4.72852 10.499 4.72852Z" stroke="#6C7072" strokeWidth="1.4"/>
            </svg>
          </div>
          <span className="nav-text">Alertes</span>
        </button>

        {/* Navigation Divider */}
        <div className="nav-divider" />

        {/* Interventions Button */}
        <button
          onClick={() => handleItemClick('interventions')}
          className="nav-button nav-button-interventions"
        >
          <div className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_9448_22)">
                <path d="M22.5549 13.662L20.6549 6.82595C20.0979 4.82328 18.8876 3.06424 17.2162 1.82842C15.5448 0.592603 13.5083 -0.0490638 11.4303 0.00541635C9.35238 0.0598965 7.35227 0.807397 5.74792 2.1291C4.14358 3.4508 3.02706 5.27085 2.57586 7.29995L1.10486 13.915C0.942375 14.6459 0.946132 15.404 1.11585 16.1333C1.28557 16.8626 1.61692 17.5444 2.08544 18.1285C2.55396 18.7126 3.14768 19.184 3.82277 19.5079C4.49786 19.8318 5.23708 20 5.98586 20H7.09986C7.32937 21.1302 7.94259 22.1464 8.8356 22.8763C9.72861 23.6062 10.8465 24.005 11.9999 24.005C13.1532 24.005 14.2711 23.6062 15.1641 22.8763C16.0571 22.1464 16.6703 21.1302 16.8999 20H17.7379C18.5087 20 19.2691 19.8218 19.9596 19.4794C20.6502 19.1369 21.2522 18.6395 21.7187 18.0258C22.1852 17.4122 22.5034 16.699 22.6487 15.942C22.7939 15.185 22.7621 14.4046 22.5559 13.662H22.5549ZM11.9999 22C11.3816 21.9974 10.7792 21.8039 10.2752 21.4459C9.77109 21.0879 9.38994 20.5829 9.18386 20H14.8159C14.6098 20.5829 14.2286 21.0879 13.7246 21.4459C13.2205 21.8039 12.6181 21.9974 11.9999 22ZM20.1259 16.815C19.8472 17.1846 19.4862 17.4842 19.0715 17.6899C18.6568 17.8956 18.1998 18.0018 17.7369 18H5.98586C5.53664 17.9999 5.09318 17.8989 4.6882 17.7045C4.28322 17.5101 3.92707 17.2273 3.64602 16.8768C3.36498 16.5264 3.16622 16.1173 3.06442 15.6798C2.96262 15.2423 2.96038 14.7875 3.05786 14.349L4.52786 7.73295C4.88221 6.13916 5.75917 4.70955 7.01932 3.6714C8.27946 2.63324 9.85048 2.04612 11.4826 2.00336C13.1148 1.96061 14.7144 2.46467 16.0272 3.43542C17.3399 4.40617 18.2905 5.7879 18.7279 7.36095L20.6279 14.1969C20.7534 14.6423 20.7734 15.1108 20.6863 15.5653C20.5991 16.0197 20.4072 16.4476 20.1259 16.815Z" fill="#6C7072"/>
              </g>
              <defs>
                <clipPath id="clip0_9448_22">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <span className="nav-text">Interventions</span>
        </button>

        {/* Rapports Button */}
        <button
          onClick={() => handleItemClick('rapports')}
          className="nav-button nav-button-rapports"
        >
          <div className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_9448_15)">
                <path d="M20.1371 24C19.7672 23.999 19.4011 23.9247 19.0601 23.7813C18.719 23.638 18.4097 23.4285 18.1501 23.165L12.0001 17.051L5.85012 23.169C5.45515 23.5697 4.94861 23.8422 4.39654 23.9508C3.84447 24.0594 3.27247 23.9992 2.75512 23.778C2.23264 23.5678 1.78567 23.205 1.47258 22.7369C1.15949 22.2688 0.994841 21.7171 1.00012 21.154V5C1.00012 3.67392 1.52691 2.40215 2.46459 1.46447C3.40227 0.526784 4.67404 0 6.00012 0L18.0001 0C18.6567 0 19.3069 0.129329 19.9135 0.380602C20.5202 0.631876 21.0714 1.00017 21.5357 1.46447C22 1.92876 22.3683 2.47996 22.6195 3.08658C22.8708 3.69321 23.0001 4.34339 23.0001 5V21.154C23.0057 21.7167 22.8417 22.268 22.5293 22.7361C22.217 23.2041 21.7709 23.5672 21.2491 23.778C20.8969 23.9253 20.5189 24.0008 20.1371 24ZM6.00012 2C5.20447 2 4.44141 2.31607 3.8788 2.87868C3.31619 3.44129 3.00012 4.20435 3.00012 5V21.154C2.99976 21.3206 3.04879 21.4836 3.14102 21.6224C3.23325 21.7612 3.36455 21.8695 3.51831 21.9337C3.67208 21.9979 3.84143 22.0151 4.00496 21.9831C4.1685 21.9512 4.31888 21.8714 4.43712 21.754L11.3001 14.933C11.4875 14.7468 11.7409 14.6422 12.0051 14.6422C12.2693 14.6422 12.5228 14.7468 12.7101 14.933L19.5651 21.752C19.6834 21.8694 19.8338 21.9492 19.9973 21.9811C20.1608 22.0131 20.3302 21.9959 20.4839 21.9317C20.6377 21.8675 20.769 21.7592 20.8612 21.6204C20.9535 21.4816 21.0025 21.3186 21.0021 21.152V5C21.0021 4.20435 20.6861 3.44129 20.1234 2.87868C19.5608 2.31607 18.7978 2 18.0021 2H6.00012Z" fill="#6C7072"/>
              </g>
              <defs>
                <clipPath id="clip0_9448_15">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <span className="nav-text nav-text-rapports">Rapports</span>
        </button>

        {/* User Profile Section */}
        <div className="user-profile">
          <div className="user-avatar-wrapper">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/1ab2dc1480792ddc1408714dce2a95899a982d6e?width=152"
              alt="Mohamed Samir"
              className="user-avatar-img"
            />
          </div>
          <div className="user-details">
            <div className="user-name">Mohamed Samir</div>
            <div className="user-role">Technicien 1</div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="logout-container">
          <button onClick={handleLogout} className="logout-btn">
            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.4166 3.125L9.72646 3.36858C7.04024 4.31667 5.69713 4.79071 4.93188 5.87231C4.16663 6.95392 4.16663 8.37823 4.16663 11.2269V13.7731C4.16663 16.6218 4.16663 18.046 4.93188 19.1277C5.69713 20.2093 7.04024 20.6833 9.72646 21.6315L10.4166 21.875" stroke="#163300" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10.4166 12.5H20.8333M10.4166 12.5C10.4166 11.7706 12.494 10.4078 13.0208 9.89581M10.4166 12.5C10.4166 13.2294 12.494 14.5922 13.0208 15.1041" stroke="#163300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="logout-label">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideNavigation;
