def thuat_toan_floyd(ma_tran_trong_so, so_dinh):
    D = [[cot for cot in hang] for hang in ma_tran_trong_so]
    
    P = [[None for _ in range(so_dinh)] for _ in range(so_dinh)]
    for i in range(so_dinh):
        for j in range(so_dinh):
            if i != j and ma_tran_trong_so[i][j] != float('inf'):
                P[i][j] = i

    for k in range(so_dinh):
        for i in range(so_dinh):
            for j in range(so_dinh):
                if D[i][k] + D[k][j] < D[i][j]:
                    D[i][j] = D[i][k] + D[k][j]
                    P[i][j] = P[k][j]
                    
    return D, P