import React from 'react'

const AlertsStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
      {/* Alertes Non Résolues */}
      <div className="flex p-6 justify-center items-center rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 w-full">
          <div className="flex w-11 h-11 p-3 flex-col justify-center items-center rounded-full bg-[#FEE2E2] flex-shrink-0">
            <div className="flex w-5 h-5 justify-center items-center">
              <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.99953 1.75C10.5542 1.75 11.0659 2.04297 11.3472 2.52344L19.7847 16.8984C20.0698 17.3828 20.0698 17.9805 19.7925 18.4648C19.5152 18.9492 18.9956 19.25 18.437 19.25H1.56203C1.00344 19.25 0.48391 18.9492 0.206566 18.4648C-0.0707777 17.9805 -0.0668715 17.3789 0.214379 16.8984L8.65188 2.52344C8.93313 2.04297 9.44485 1.75 9.99953 1.75ZM9.99953 6.75C9.48 6.75 9.06203 7.16797 9.06203 7.6875V12.0625C9.06203 12.582 9.48 13 9.99953 13C10.5191 13 10.937 12.582 10.937 12.0625V7.6875C10.937 7.16797 10.5191 6.75 9.99953 6.75ZM11.2495 15.5C11.2495 15.1685 11.1178 14.8505 10.8834 14.6161C10.649 14.3817 10.3311 14.25 9.99953 14.25C9.66801 14.25 9.35007 14.3817 9.11565 14.6161C8.88123 14.8505 8.74953 15.1685 8.74953 15.5C8.74953 15.8315 8.88123 16.1495 9.11565 16.3839C9.35007 16.6183 9.66801 16.75 9.99953 16.75C10.3311 16.75 10.649 16.6183 10.8834 16.3839C11.1178 16.1495 11.2495 15.8315 11.2495 15.5Z" fill="#DC2626"/>
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#4B5563] font-inter text-sm font-medium leading-5 mb-1">
              Alertes Non Résolues
            </div>
            <div className="text-[#DC2626] font-inter text-2xl font-bold leading-8">
              3
            </div>
          </div>
        </div>
      </div>

      {/* Alertes Résolues */}
      <div className="flex p-6 justify-center items-center rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 w-full">
          <div className="flex w-11 h-11 p-3 flex-col justify-center items-center rounded-full bg-[#DCFCE7] flex-shrink-0">
            <div className="flex w-5 h-5 justify-center items-center">
              <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_220_1307)">
                  <path d="M10 20.5C12.6522 20.5 15.1957 19.4464 17.0711 17.5711C18.9464 15.6957 20 13.1522 20 10.5C20 7.84784 18.9464 5.3043 17.0711 3.42893C15.1957 1.55357 12.6522 0.5 10 0.5C7.34784 0.5 4.8043 1.55357 2.92893 3.42893C1.05357 5.3043 0 7.84784 0 10.5C0 13.1522 1.05357 15.6957 2.92893 17.5711C4.8043 19.4464 7.34784 20.5 10 20.5ZM14.4141 8.66406L9.41406 13.6641C9.04688 14.0312 8.45312 14.0312 8.08984 13.6641L5.58984 11.1641C5.22266 10.7969 5.22266 10.2031 5.58984 9.83984C5.95703 9.47656 6.55078 9.47266 6.91406 9.83984L8.75 11.6758L13.0859 7.33594C13.4531 6.96875 14.0469 6.96875 14.4102 7.33594C14.7734 7.70312 14.7773 8.29687 14.4102 8.66016L14.4141 8.66406Z" fill="#16A34A"/>
                </g>
                <defs>
                  <clipPath id="clip0_220_1307">
                    <path d="M0 0.5H20V20.5H0V0.5Z" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#4B5563] font-inter text-sm font-medium leading-5 mb-1">
              Alertes Résolues
            </div>
            <div className="text-[#16A34A] font-inter text-2xl font-bold leading-8">
              3
            </div>
          </div>
        </div>
      </div>

      {/* Temps Moyen de Résolution */}
      <div className="flex p-6 justify-center items-center rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 w-full">
          <div className="flex w-11 h-11 p-3 flex-col justify-center items-center rounded-full bg-[#FFEDD5] flex-shrink-0">
            <div className="flex w-5 h-5 justify-center items-center">
              <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_220_1317)">
                  <path d="M10 0.5C12.6522 0.5 15.1957 1.55357 17.0711 3.42893C18.9464 5.3043 20 7.84784 20 10.5C20 13.1522 18.9464 15.6957 17.0711 17.5711C15.1957 19.4464 12.6522 20.5 10 20.5C7.34784 20.5 4.8043 19.4464 2.92893 17.5711C1.05357 15.6957 0 13.1522 0 10.5C0 7.84784 1.05357 5.3043 2.92893 3.42893C4.8043 1.55357 7.34784 0.5 10 0.5ZM9.0625 5.1875V10.5C9.0625 10.8125 9.21875 11.1055 9.48047 11.2812L13.2305 13.7812C13.6602 14.0703 14.2422 13.9531 14.5312 13.5195C14.8203 13.0859 14.7031 12.5078 14.2695 12.2188L10.9375 10V5.1875C10.9375 4.66797 10.5195 4.25 10 4.25C9.48047 4.25 9.0625 4.66797 9.0625 5.1875Z" fill="#EA580C"/>
                </g>
                <defs>
                  <clipPath id="clip0_220_1317">
                    <path d="M0 0.5H20V20.5H0V0.5Z" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#4B5563] font-inter text-sm font-medium leading-5 mb-1">
              Temps Moyen de Résolution
            </div>
            <div className="text-[#EA580C] font-inter text-2xl font-bold leading-8">
              2.5h
            </div>
          </div>
        </div>
      </div>

      {/* Total Alertes */}
      <div className="flex p-6 justify-center items-center rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 w-full">
          <div className="flex w-11 h-11 p-3 flex-col justify-center items-center rounded-full" style={{ backgroundColor: 'rgba(180, 204, 95, 0.20)' }}>
            <div className="flex w-5 h-5 justify-center items-center">
              <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 3C2.5 2.30859 1.94141 1.75 1.25 1.75C0.558594 1.75 0 2.30859 0 3V16.125C0 17.8516 1.39844 19.25 3.125 19.25H18.75C19.4414 19.25 20 18.6914 20 18C20 17.3086 19.4414 16.75 18.75 16.75H3.125C2.78125 16.75 2.5 16.4688 2.5 16.125V3ZM18.3828 6.38281C18.8711 5.89453 18.8711 5.10156 18.3828 4.61328C17.8945 4.125 17.1016 4.125 16.6133 4.61328L12.5 8.73047L10.2578 6.48828C9.76953 6 8.97656 6 8.48828 6.48828L4.11328 10.8633C3.625 11.3516 3.625 12.1445 4.11328 12.6328C4.60156 13.1211 5.39453 13.1211 5.88281 12.6328L9.375 9.14453L11.6172 11.3867C12.1055 11.875 12.8984 11.875 13.3867 11.3867L18.3867 6.38672L18.3828 6.38281Z" fill="#004AB3"/>
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#4B5563] font-inter text-sm font-medium leading-5 mb-1">
              Total Alertes
            </div>
            <div className="text-[#004AB3] font-inter text-2xl font-bold leading-8">
              6
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertsStats
