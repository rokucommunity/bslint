sub test()
    a = Rnd(10)
    if a = 0
        print "zero"
    else if(a <= 5)
        print "low"
    else if a > 5
        print "high"
    end if

    if a = 10 print "impossible!"
    if(a = 11)print "even more!"
    if (a = 12) print "and more!"
    if a = 13 print "ever more!"

    while(a < 20)
        a++
    end while
    while (a < 30)
        a++
    end while
    while a > 0
        a--
    end while
end sub
