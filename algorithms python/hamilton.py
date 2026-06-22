def kiem_tra_hop_le(v, ma_tran_ke, duong_di, vi_tri):
    if ma_tran_ke[duong_di[vi_tri - 1]][v] == 0:
        return False
    if v in duong_di:
        return False
    return True

def quay_lui_hamilton(ma_tran_ke, duong_di, vi_tri):
    so_dinh = len(ma_tran_ke)
    
    if vi_tri == so_dinh:
        return ma_tran_ke[duong_di[vi_tri - 1]][duong_di] > 0

    for v in range(so_dinh):
        if kiem_tra_hop_le(v, ma_tran_ke, duong_di, vi_tri):
            duong_di[vi_tri] = v
            
            if quay_lui_hamilton(ma_tran_ke, duong_di, vi_tri + 1):
                return True
                
            duong_di[vi_tri] = -1
            
    return False

def thuat_toan_hamilton(ma_tran_ke, dinh_bat_dau=1):
    so_dinh = len(ma_tran_ke)
    duong_di = [-1] * so_dinh
    duong_di = dinh_bat_dau - 1 
    
    if quay_lui_hamilton(ma_tran_ke, duong_di, 1):
        # Trả về kết quả 1-based và khép kín chu trình
        return [d + 1 for d in duong_di] + [dinh_bat_dau]
    return []