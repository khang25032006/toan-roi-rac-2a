def thuat_toan_bellman_ford(danh_sach_canh, so_dinh, dinh_bat_dau):
    khoang_cach = {i: float('inf') for i in range(1, so_dinh + 1)}
    khoang_cach[dinh_bat_dau] = 0
    truoc = {i: None for i in range(1, so_dinh + 1)}
    
    for _ in range(so_dinh - 1):
        for u, v, trong_so in danh_sach_canh:
            if khoang_cach[u] != float('inf') and khoang_cach[u] + trong_so < khoang_cach[v]:
                khoang_cach[v] = khoang_cach[u] + trong_so
                truoc[v] = u
                
    for u, v, trong_so in danh_sach_canh:
        if khoang_cach[u] != float('inf') and khoang_cach[u] + trong_so < khoang_cach[v]:
            print("Đồ thị chứa chu trình âm!")
            return None, None
            
    return khoang_cach, truoc
