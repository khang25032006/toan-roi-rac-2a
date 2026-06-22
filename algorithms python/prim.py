def thuat_toan_prim(dinh_bat_dau, so_dinh, ma_tran_trong_so):
    da_duyet = [False] * (so_dinh + 1)
    tap_dinh_X = [dinh_bat_dau]  
    da_duyet[dinh_bat_dau] = True
    tong_trong_so = 0
    
    danh_sach_canh_cay_khung = [] 
    
    while len(tap_dinh_X) < so_dinh:
        trong_so_nho_nhat = float('inf') 
        u_duoc_chon = -1
        v_duoc_chon = -1
        
        for u in tap_dinh_X:
            for v in range(1, so_dinh + 1):
                trong_so = ma_tran_trong_so[u-1][v-1]
                if not da_duyet[v] and trong_so > 0 and trong_so < trong_so_nho_nhat:
                    trong_so_nho_nhat = trong_so
                    u_duoc_chon = u
                    v_duoc_chon = v
                    
        if u_duoc_chon == -1:
            break 
            
        tap_dinh_X.append(v_duoc_chon)
        da_duyet[v_duoc_chon] = True
        tong_trong_so += trong_so_nho_nhat
        danh_sach_canh_cay_khung.append((u_duoc_chon, v_duoc_chon, trong_so_nho_nhat))
        
    return tong_trong_so, danh_sach_canh_cay_khung, tap_dinh_X