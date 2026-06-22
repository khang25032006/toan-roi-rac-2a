def thuat_toan_euler(ma_tran_ke, dinh_bat_dau, co_huong=False):
    do_thi_tam = [[cot for cot in hang] for hang in ma_tran_ke]
    ngan_xep = [dinh_bat_dau]
    duong_di_euler = []
    
    while ngan_xep:
        dinh_hien_tai = ngan_xep[-1]
        co_canh_noi = False
        
        for dinh_ke in range(1, len(ma_tran_ke) + 1):
            if do_thi_tam[dinh_hien_tai - 1][dinh_ke - 1] > 0:
                do_thi_tam[dinh_hien_tai - 1][dinh_ke - 1] -= 1
                if not co_huong:
                    do_thi_tam[dinh_ke - 1][dinh_hien_tai - 1] -= 1
                    
                ngan_xep.append(dinh_ke)
                co_canh_noi = True
                break
                
        if not co_canh_noi:
            duong_di_euler.append(ngan_xep.pop())
            
    return duong_di_euler[::-1]